import { getDb } from "../Tools/DatabaseTool.js";
import { logger } from "../Tools/LogTool.js";

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

export class SessionsResource {
  static listSessions() {
    const db = getDb();
    const query = `
      SELECT 
        s.*,
        COUNT(r.id) AS total_requests,
        MAX(r.created_at) AS last_request_at
      FROM sessions s
      LEFT JOIN requests r ON r.session_id = s.id
      GROUP BY s.id
      ORDER BY s.id ASC
    `;
    return db.prepare(query).all();
  }

  static getSessionById(id) {
    const db = getDb();
    return db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);
  }

  static getSessionByToken(token) {
    const db = getDb();
    return db.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
  }

  static createSession({
    name,
    token,
    description = "",
    response_status = 200,
    response_content_type = "application/json",
    response_body = '{"success": true, "message": "Webhook received successfully"}',
    response_delay_ms = 0,
    forward_url = null,
    max_requests = 500,
  }) {
    const db = getDb();

    if (!name || !name.trim()) {
      throw new Error("O nome da sessão é obrigatório.");
    }

    let finalToken = token ? slugify(token) : slugify(name);
    if (!finalToken) {
      finalToken = `sess_${Math.random().toString(36).substring(2, 9)}`;
    }

    // Check if token exists, if so append random suffix
    const existing = db.prepare("SELECT id FROM sessions WHERE token = ?").get(finalToken);
    if (existing) {
      if (token) {
        throw new Error(`O token/slug '${finalToken}' já está em uso.`);
      }
      finalToken = `${finalToken}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const stmt = db.prepare(`
      INSERT INTO sessions (
        token, name, description, response_status, response_content_type,
        response_body, response_delay_ms, forward_url, max_requests, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      finalToken,
      name.trim(),
      description || "",
      Number(response_status) || 200,
      response_content_type || "application/json",
      typeof response_body === "string" ? response_body : JSON.stringify(response_body),
      Math.max(0, Number(response_delay_ms) || 0),
      forward_url ? forward_url.trim() : null,
      Number(max_requests) || 500
    );

    return this.getSessionById(result.lastInsertRowid);
  }

  static updateSession(id, data) {
    const db = getDb();
    const session = this.getSessionById(id);
    if (!session) {
      throw new Error("Sessão não encontrada.");
    }

    let token = session.token;
    if (data.token && data.token !== session.token) {
      const cleanToken = slugify(data.token);
      const existing = db.prepare("SELECT id FROM sessions WHERE token = ? AND id != ?").get(cleanToken, id);
      if (existing) {
        throw new Error(`O token/slug '${cleanToken}' já está em uso por outra sessão.`);
      }
      token = cleanToken;
    }

    const name = data.name !== undefined ? data.name.trim() : session.name;
    const description = data.description !== undefined ? data.description : session.description;
    const response_status = data.response_status !== undefined ? Number(data.response_status) : session.response_status;
    const response_content_type = data.response_content_type !== undefined ? data.response_content_type : session.response_content_type;
    const response_body = data.response_body !== undefined
      ? (typeof data.response_body === "string" ? data.response_body : JSON.stringify(data.response_body))
      : session.response_body;
    const response_delay_ms = data.response_delay_ms !== undefined ? Math.max(0, Number(data.response_delay_ms)) : session.response_delay_ms;
    const forward_url = data.forward_url !== undefined ? (data.forward_url ? data.forward_url.trim() : null) : session.forward_url;
    const max_requests = data.max_requests !== undefined ? Number(data.max_requests) : session.max_requests;
    const is_active = data.is_active !== undefined ? (data.is_active ? 1 : 0) : session.is_active;

    db.prepare(`
      UPDATE sessions SET
        token = ?,
        name = ?,
        description = ?,
        response_status = ?,
        response_content_type = ?,
        response_body = ?,
        response_delay_ms = ?,
        forward_url = ?,
        max_requests = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      token,
      name,
      description,
      response_status,
      response_content_type,
      response_body,
      response_delay_ms,
      forward_url,
      max_requests,
      is_active,
      id
    );

    return this.getSessionById(id);
  }

  static deleteSession(id) {
    const db = getDb();
    const session = this.getSessionById(id);
    if (!session) {
      throw new Error("Sessão não encontrada.");
    }
    db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
    return true;
  }

  static ensureDefaultSession() {
    const db = getDb();
    const count = db.prepare("SELECT count(*) as total FROM sessions").get()?.total || 0;
    if (count === 0) {
      logger.info("Criando sessão inicial 'default'...");
      this.createSession({
        name: "Sessão Padrão",
        token: "default",
        description: "Sessão padrão para testes e webhooks legados",
        response_status: 200,
        response_body: '{"success": true, "message": "Webhook recebido com sucesso"}',
      });
      logger.info("Sessão inicial 'default' criada.");
    }
  }
}
