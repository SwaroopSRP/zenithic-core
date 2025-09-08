import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser
} from "../controllers/auth.controller.js";
import verifyAccessToken from "../middlewares/auth.middleware.js";
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

// Secure/protected route
authRouter.route("/logout").post(verifyAccessToken, logoutUser);

export default authRouter;
