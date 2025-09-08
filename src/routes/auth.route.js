import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";
import {
    applyRegistrationValidations,
    applyLoginValidations
} from "../validations/index.js";
import validate from "../middlewares/validator.middleware.js";

const authRouter = Router();

authRouter
    .route("/register")
    .post(applyRegistrationValidations(), validate, registerUser);

authRouter.route("/login").post(applyLoginValidations(), validate, loginUser);

export default authRouter;
