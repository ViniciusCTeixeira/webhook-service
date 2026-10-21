import { RequestsResource } from "../Resources/RequestsResource.js";
import { SessionsResource } from "../Resources/SessionsResource.js";
import { emitToSession } from "../Tools/SocketTool.js";

export class RequestsController {
  static async list(req, res) {
    try {
      const { sessionId, token, limit, offset, method, search } = req.query;

      let targetSessionId = sessionId;
      if (!targetSessionId && token) {
        const session = SessionsResource.getSessionByToken(token);
        if (session) {
          targetSessionId = session.id;
        }
      }

      if (!targetSessionId) {
        // Fallback to default session
        const defaultSession = SessionsResource.getSessionByToken("default");
        targetSessionId = defaultSession ? defaultSession.id : 1;
      }

      const requests = RequestsResource.listRequests(targetSessionId, {
        limit,
        offset,
        method,
        search,
      });

      return res.status(200).json({ success: true, data: requests });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async get(req, res) {
    try {
      const { id } = req.params;
      const request = RequestsResource.getRequestById(id);
      if (!request) {
        return res.status(404).json({ success: false, message: "Requisição não encontrada." });
      }
      return res.status(200).json({ success: true, data: request });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const request = RequestsResource.getRequestById(id);
      if (!request) {
        return res.status(404).json({ success: false, message: "Requisição não encontrada." });
      }

      RequestsResource.deleteRequest(id);
      emitToSession(request.session_token, "requestDeleted", { id: Number(id) });
      return res.status(200).json({ success: true, message: "Requisição removida com sucesso." });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async replay(req, res) {
    try {
      const { id } = req.params;
      const { targetUrl, method, headers, body } = req.body || {};

      const result = await RequestsResource.replayRequest(id, {
        targetUrl,
        method,
        headers,
        body,
      });

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        details: error.response?.data || null,
      });
    }
  }
}
