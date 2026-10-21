import express from "express";
import { TesterController } from "../Controllers/TesterController.js";

export const registerTesterRoutes = (router) => {
  const testerRouter = express.Router();

  testerRouter.post("/send", TesterController.send);

  router.use("/tester", testerRouter);
};
