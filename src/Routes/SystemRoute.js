import express from "express";
import { SystemController } from "../Controllers/SystemController.js";

export const registerSystemRoutes = (router) => {
  const systemRouter = express.Router();

  systemRouter.get("/status", SystemController.status);
  systemRouter.get("/liveness", SystemController.liveness);
  systemRouter.get("/readiness", SystemController.readiness);

  router.use("/system", systemRouter);
};
