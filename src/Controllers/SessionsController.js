import { SessionsResource } from "../Resources/SessionsResource.js";
import { RequestsResource } from "../Resources/RequestsResource.js";
import { emitToSession, emitGlobal } from "../Tools/SocketTool.js";

export class SessionsController {
  static async list(_req, res) {
    try {
      const sessions = SessionsResource.listSessions();
      return res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async get(req, res) {
    try {
      const { id } = req.params;
      const session = isNaN(id)
        ? SessionsResource.getSessionByToken(id)
        : SessionsResource.getSessionById(id);

      if (!session) {
        return res.status(404).json({ success: false, message: "Sessão não encontrada." });
      }

      return res.status(200).json({ success: true, data: session });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req, res) {
    try {
      const session = SessionsResource.createSession(req.body);
      emitGlobal("sessionCreated", session);
      return res.status(201).json({ success: true, message: "Sessão criada com sucesso.", data: session });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const session = SessionsResource.updateSession(id, req.body);
      emitGlobal("sessionUpdated", session);
      return res.status(200).json({ success: true, message: "Sessão atualizada com sucesso.", data: session });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const session = SessionsResource.getSessionById(id);
      if (!session) {
        return res.status(404).json({ success: false, message: "Sessão não encontrada." });
      }

      SessionsResource.deleteSession(id);
      emitGlobal("sessionDeleted", { id: Number(id), token: session.token });
      return res.status(200).json({ success: true, message: "Sessão removida com sucesso." });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async clear(req, res) {
    try {
      const { id } = req.params;
      const session = isNaN(id)
        ? SessionsResource.getSessionByToken(id)
        : SessionsResource.getSessionById(id);

      if (!session) {
        return res.status(404).json({ success: false, message: "Sessão não encontrada." });
      }

      RequestsResource.clearSessionRequests(session.id);
      emitToSession(session.token, "clearRequests", { sessionId: session.id, token: session.token });
      return res.status(200).json({ success: true, message: "Requisições da sessão limpas com sucesso." });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
