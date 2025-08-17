import { Router } from "express";
import healthChecker from "../controllers/healthchecker.controller.js";

const healthCheckerRouter = Router();

healthCheckerRouter.route("/").get(healthChecker);

export default healthCheckerRouter;
