import express from "express";
import { SessionsController } from "../Controllers/SessionsController.js";

export const registerSessionsRoutes = (router) => {
  const sessionsRouter = express.Router();

  sessionsRouter.get("/", SessionsController.list);
  sessionsRouter.post("/", SessionsController.create);
  sessionsRouter.get("/:id", SessionsController.get);
  sessionsRouter.put("/:id", SessionsController.update);
  sessionsRouter.delete("/:id", SessionsController.delete);
  sessionsRouter.post("/:id/clear", SessionsController.clear);

  router.use("/sessions", sessionsRouter);
};
