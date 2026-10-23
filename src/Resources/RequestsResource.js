import axios from "axios";
import { getDb } from "../Tools/DatabaseTool.js";
import { logger } from "../Tools/LogTool.js";
import { emitToSession } from "../Tools/SocketTool.js";

const safeJsonParse = (str, fallback = {}) => {
  if (!str) return fallback;
  if (typeof str === "object") return str;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
};

export class RequestsResource {
  static listRequests(sessionId, { limit = 100, offset = 0, method = null, search = null } = {}) {
    const db = getDb();
    let query = `SELECT * FROM requests WHERE session_id = ?`;
    const params = [sessionId];

    if (method && method.toUpperCase() !== "ALL") {
      query += ` AND method = ?`;
      params.push(method.toUpperCase());
    }

    if (search && search.trim()) {
      query += ` AND (path LIKE ? OR body LIKE ? OR headers LIKE ? OR query_params LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(Math.min(500, Math.max(1, Number(limit))), Math.max(0, Number(offset)));

    const rows = db.prepare(query).all(...params);
    return rows.map((row) => ({
      ...row,
      query_params: safeJsonParse(row.query_params),
      headers: safeJsonParse(row.headers),
      body: safeJsonParse(row.body),
    }));
  }

  static getRequestById(id) {
    const db = getDb();
    const row = db.prepare("SELECT * FROM requests WHERE id = ?").get(id);
    if (!row) return null;
    return {
      ...row,
      query_params: safeJsonParse(row.query_params),
      headers: safeJsonParse(row.headers),
      body: safeJsonParse(row.body),
    };
  }

  static async recordRequest(session, {
    method,
    path,
    queryParams = {},
    headers = {},
    body = null,
    rawBody = "",
    clientIp = "",
    contentType = "",
    sizeBytes = 0,
    durationMs = 0,
    responseStatus = 200,
  }) {
    const db = getDb();

    // Check request retention limit
    const maxRequests = session.max_requests || 500;
    const currentCount = db.prepare("SELECT count(*) as total FROM requests WHERE session_id = ?").get(session.id)?.total || 0;

    if (currentCount >= maxRequests) {
      const excess = currentCount - maxRequests + 1;
      db.prepare(`
        DELETE FROM requests 
        WHERE id IN (
          SELECT id FROM requests 
          WHERE session_id = ? 
          ORDER BY id ASC 
          LIMIT ?
        )
      `).run(session.id, excess);
    }

    const jsonHeaders = JSON.stringify(headers);
    const jsonQuery = JSON.stringify(queryParams);
    const bodyStr = typeof body === "object" ? JSON.stringify(body) : (body ? String(body) : "");

    const stmt = db.prepare(`
      INSERT INTO requests (
        session_id, session_token, method, path, query_params,
        headers, body, raw_body, client_ip, content_type,
        size_bytes, duration_ms, response_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now'))
    `);

    const result = stmt.run(
      session.id,
      session.token,
      method.toUpperCase(),
      path,
      jsonQuery,
      jsonHeaders,
      bodyStr,
      rawBody || "",
      clientIp,
      contentType || "",
      sizeBytes,
      durationMs,
      responseStatus
    );

    const insertedId = result.lastInsertRowid;
    const createdRecord = this.getRequestById(insertedId);

    // Emit live WebSocket event for connected dashboard clients
    emitToSession(session.token, "newRequest", createdRecord);

    // Auto-Forwarding if configured
    if (session.forward_url) {
      this.triggerAutoForward(insertedId, session.forward_url, method, headers, rawBody || bodyStr);
    }

    return createdRecord;
  }

  static async triggerAutoForward(requestId, forwardUrl, method, headers, payload) {
    try {
    const cleanHeaders = {};
    for (const [k, v] of Object.entries(headers || {})) {
      const lower = k.toLowerCase();
      if (["host", "content-length", "connection", "transfer-encoding"].includes(lower)) continue;
      cleanHeaders[k] = v;
    }

    const start = Date.now();
    const response = await axios({
      url: forwardUrl,
      method,
      headers: cleanHeaders,
      data: payload,
      timeout: 10000,
      validateStatus: () => true, // Don't throw on 4xx/5xx
    });

      const db = getDb();
      const respData = typeof response.data === "object" ? JSON.stringify(response.data) : String(response.data);

      db.prepare(`
        UPDATE requests 
        SET forward_status = ?, forward_response = ? 
        WHERE id = ?
      `).run(response.status, respData.substring(0, 5000), requestId);

      logger.info(`Auto-forwarded request #${requestId} to ${forwardUrl} -> status ${response.status} (${Date.now() - start}ms)`);
    } catch (err) {
      logger.error(`Falha no auto-forwarding para ${forwardUrl}:`, err.message);
      try {
        const db = getDb();
        db.prepare(`
          UPDATE requests 
          SET forward_status = 502, forward_error = ? 
          WHERE id = ?
        `).run(err.message, requestId);
      } catch {
        // ignore
      }
    }
  }

  static clearSessionRequests(sessionId) {
    const db = getDb();
    db.prepare("DELETE FROM requests WHERE session_id = ?").run(sessionId);
    return true;
  }

  static deleteRequest(id) {
    const db = getDb();
    const row = db.prepare("SELECT * FROM requests WHERE id = ?").get(id);
    if (!row) return false;
    db.prepare("DELETE FROM requests WHERE id = ?").run(id);
    return true;
  }

  static async replayRequest(id, { targetUrl = null, method = null, headers = null, body = null } = {}) {
    const record = this.getRequestById(id);
    if (!record) {
      throw new Error("Requisição não encontrada para replay.");
    }

    const finalUrl = targetUrl || `${process.env.PUBLIC_URL || "http://localhost:3000"}${record.path}`;
    const finalMethod = (method || record.method).toUpperCase();
    
    // Clean headers case-insensitively
    const rawHeaders = headers || record.headers || {};
    const finalHeaders = {};
    for (const [k, v] of Object.entries(rawHeaders)) {
      const lower = k.toLowerCase();
      if (["host", "content-length", "connection", "transfer-encoding"].includes(lower)) continue;
      finalHeaders[k] = v;
    }

    // Determine payload
    let finalData = body !== undefined ? body : record.body;
    if (finalData === null || finalData === undefined) {
      finalData = record.raw_body;
    }

    const startTime = Date.now();
    const response = await axios({
      url: finalUrl,
      method: finalMethod,
      headers: finalHeaders,
      data: finalData,
      timeout: 15000,
      validateStatus: () => true,
    });

    return {
      success: true,
      durationMs: Date.now() - startTime,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
    };
  }
}
