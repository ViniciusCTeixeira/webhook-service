import { SessionsResource } from "../Resources/SessionsResource.js";
import { RequestsResource } from "../Resources/RequestsResource.js";
import { logger } from "../Tools/LogTool.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class WebhookIngestController {
  static async handle(req, res) {
    const startTime = Date.now();

    try {
      // Determine token from route param or fallback to 'default'
      let token = req.params?.token;
      if (!token && req.path === "/webhook") {
        token = "default";
      }

      if (!token) {
        return res.status(400).json({ success: false, message: "Token da sessão não informado." });
      }

      // Find or auto-provision session
      let session = SessionsResource.getSessionByToken(token);
      if (!session) {
        logger.info(`Sessão '${token}' não encontrada. Criando automaticamente...`);
        session = SessionsResource.createSession({
          name: `Sessão ${token}`,
          token,
          description: "Criada automaticamente via webhook de entrada",
        });
      }

      // Check if session is active
      if (!session.is_active) {
        return res.status(403).json({ success: false, message: "Esta sessão de webhook está desativada." });
      }

      // Extract client IP
      const clientIp = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
      const rawBody = req.rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body || ""));
      const sizeBytes = Buffer.byteLength(rawBody, "utf8");

      // Apply simulated response delay if configured
      if (session.response_delay_ms > 0) {
        await delay(session.response_delay_ms);
      }

      const durationMs = Date.now() - startTime;
      const statusToReturn = Number(session.response_status) || 200;
      const contentType = session.response_content_type || "application/json";
      let responseBody = session.response_body || '{"success": true, "message": "Webhook received"}';

      // Record request in database
      await RequestsResource.recordRequest(session, {
        method: req.method,
        path: req.originalUrl || req.path,
        queryParams: req.query || {},
        headers: req.headers || {},
        body: req.body,
        rawBody,
        clientIp,
        contentType: req.headers["content-type"] || "",
        sizeBytes,
        durationMs,
        responseStatus: statusToReturn,
      });

      // Send configured response to the webhook caller
      res.setHeader("Content-Type", contentType);
      res.setHeader("X-Webhook-Session", session.token);
      res.setHeader("X-Processing-Time-Ms", durationMs.toString());

      return res.status(statusToReturn).send(responseBody);
    } catch (error) {
      logger.error("Erro ao processar webhook:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
