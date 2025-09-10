import { Router } from "express";
import healthChecker from "../controllers/healthchecker.controllers.js";

const healthCheckerRouter = Router();

healthCheckerRouter.route("/").get(healthChecker);

export default healthCheckerRouter;
