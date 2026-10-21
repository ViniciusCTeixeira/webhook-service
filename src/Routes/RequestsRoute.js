import express from "express";
import { RequestsController } from "../Controllers/RequestsController.js";

export const registerRequestsRoutes = (router) => {
  const requestsRouter = express.Router();

  requestsRouter.get("/", RequestsController.list);
  requestsRouter.get("/:id", RequestsController.get);
  requestsRouter.delete("/:id", RequestsController.delete);
  requestsRouter.post("/:id/replay", RequestsController.replay);

  router.use("/requests", requestsRouter);
};
