import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    verifyEmail,
    refreshAccessToken,
    forgotPasswordRequest,
    resetPassword,
    getCurrentUser,
    changePassword,
    resendVerificationEmail
} from "../controllers/auth.controllers.js";
import verifyAccessToken from "../middlewares/auth.middlewares.js";
import {
    applyRegistrationValidations,
    applyLoginValidations,
    applyForgotPasswordValidations,
    applyResetPasswordValidations,
    applyChangePasswordValidations
} from "../validations/index.js";
import validate from "../middlewares/validator.middlewares.js";

const authRouter = Router();

// Public routes
authRouter
    .route("/register")
    .post(applyRegistrationValidations(), validate, registerUser);

authRouter.route("/login").post(applyLoginValidations(), validate, loginUser);

authRouter.route("/verify-email/:verifToken").get(verifyEmail);

authRouter.route("/refresh-token").post(refreshAccessToken);

authRouter
    .route("/forgot-password")
    .post(applyForgotPasswordValidations(), validate, forgotPasswordRequest);

authRouter
    .route("/reset-password/:resetToken")
    .post(applyResetPasswordValidations(), validate, resetPassword);

// Protected route
authRouter.route("/logout").post(verifyAccessToken, logoutUser);

authRouter.route("/current-user").post(verifyAccessToken, getCurrentUser);

authRouter
    .route("/change-password")
    .post(
        verifyAccessToken,
        applyChangePasswordValidations(),
        validate,
        changePassword
    );

authRouter
    .route("/resend-email-verification")
    .post(verifyAccessToken, resendVerificationEmail);

export default authRouter;
