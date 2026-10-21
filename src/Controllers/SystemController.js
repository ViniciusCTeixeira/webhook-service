import { getSystemMetrics, getLiveness, getReadiness } from "../Tools/HealthTool.js";

export class SystemController {
  static liveness(_req, res) {
    const result = getLiveness();
    return res.status(result.statusCode).json(result.body);
  }

  static readiness(_req, res) {
    const result = getReadiness();
    return res.status(result.statusCode).json(result.body);
  }

  static status(_req, res) {
    try {
      const metrics = getSystemMetrics();
      return res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
