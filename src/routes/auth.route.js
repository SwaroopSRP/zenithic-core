import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";
import applyUserValidations from "../validations/index.js";
import validate from "../middlewares/validator.middleware.js";

const authRouter = Router();

authRouter
    .route("/register")
    .post(applyUserValidations(), validate, registerUser);

export default authRouter;
