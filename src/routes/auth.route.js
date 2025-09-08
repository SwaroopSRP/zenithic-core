import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";
import applyUserValidations from "../validations/index.js";
import validate from "../middlewares/validator.middleware.js";

const authRouter = Router();

authRouter
    .route("/register")
    .post(applyUserValidations(), validate, registerUser);

authRouter.route("/login").post(loginUser);

export default authRouter;
