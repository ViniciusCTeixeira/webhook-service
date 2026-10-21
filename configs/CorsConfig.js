import cors from "cors";

export default class CorsConfig {
  static getMiddleware() {
    return cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-requested-with",
        "x-api-key",
        "accessKey",
        "x-session-token",
      ],
      exposedHeaders: ["*"],
    });
  }
}
