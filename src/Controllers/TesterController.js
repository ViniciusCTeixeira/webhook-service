import axios from "axios";

export class TesterController {
  static async send(req, res) {
    try {
      const { url, method = "POST", headers = {}, body = null } = req.body || {};

      if (!url) {
        return res.status(400).json({ success: false, message: "URL de destino é obrigatória." });
      }

      const startTime = Date.now();
      const response = await axios({
        url,
        method: method.toUpperCase(),
        headers: {
          "User-Agent": "WebhookService-Tester/3.0",
          ...headers,
        },
        data: body,
        timeout: 15000,
        validateStatus: () => true, // Don't throw on error status codes
      });

      return res.status(200).json({
        success: true,
        durationMs: Date.now() - startTime,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        details: error.response?.data || null,
      });
    }
  }
}
