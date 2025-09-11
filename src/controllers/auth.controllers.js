import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import { sendEmail, verifyEmailTemplate } from "../utils/mailing.js";
import ServerResponse from "../utils/api_response.js";
import ServerError from "../utils/api_error.js";
import asyncHandler from "../utils/async_handler.js";

async function genARTokens(userId) {
    try {
        const user = await userModel.findById(userId);
        const accessToken = user.genAccessToken();
        const refreshToken = user.genRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error(error);
        throw new ServerError(
            500,
            "Error occurred while generating access token!"
        );
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { email, uname, passwd, role } = req.body;

    const existingUser = await userModel.findOne({
        $or: [{ uname }, { email }]
    });
    if (existingUser) {
        throw new ServerError(
            409,
            "User with provided username or email already exists!"
        );
    }

    const user = await userModel.create({
        email,
        passwd,
        uname,
        isEmailVerified: false
    });

    const { rawToken, hashedToken, tokenExpiry } = user.genTempToken();
    user.emailVerifToken = hashedToken;
    user.emailVerifExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Verification of your email required",
        emailContent: verifyEmailTemplate(
            user.uname,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${rawToken}`
        )
    });

    const createdUser = await userModel
        .findById(user._id)
        .select("-passwd -refreshToken -emailVerifToken -emailVerifExpiry");
    if (!createdUser) {
        throw new ServerError(
            500,
            "Error occurred while registering the new user!"
        );
    }

    return res
        .status(201)
        .json(
            new ServerResponse(
                200,
                { user: createdUser },
                "User has been successfully registered and verification email sent to given email ID."
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { uname, passwd } = req.body;
    if (!uname || !passwd) {
        throw new ServerError(400, "Username and password are required!");
    }

    const user = await userModel.findOne({ uname });
    if (!user) {
        throw new ServerError(401, `User with username ${uname} not found!`);
    }

    const isPasswdValid = await user.checkPassword(passwd);
    if (!isPasswdValid) {
        throw new ServerError(401, "Invalid password!");
    }

    const { accessToken, refreshToken } = await genARTokens(user._id);

    const loggedInUser = await userModel
        .findById(user._id)
        .select("-passwd -refreshToken -emailVerifToken -emailVerifExpiry");

    const cookieOptions = { httpOnly: true, secure: true };

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ServerResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User has been successfully logged in."
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await userModel.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: "" } },
        { new: true }
    );

    const cookieOptions = { httpOnly: true, secure: true };

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ServerResponse(200, null, "User successfully logged out."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ServerResponse(200, { user: req.user }, "Fetched current user.")
        );
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { verifToken } = req.params;
    if (!verifToken) {
        throw new ServerError(400, "Email verification token is missing!");
    }

    let hashedToken = crypto
        .createHash("sha256")
        .update(verifToken)
        .digest("hex");

    const user = await userModel.findOne({
        emailVerifToken: hashedToken,
        emailVerifExpiry: { $gt: Date.now() }
    });
    if (!user) {
        throw new ServerError(
            400,
            "Invalid or expired email verification token!"
        );
    }

    user.isEmailVerified = true;
    user.emailVerifToken = undefined;
    user.emailVerifExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ServerResponse(
                200,
                { isEmailVerified: true },
                "Email successfully verified."
            )
        );
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.user?.id);
    if (!user) {
        throw new ServerError(404, "User does not exist!");
    }

    if (user.isEmailVerified) {
        throw new ServerError(409, "Email is already verified!");
    }

    const { rawToken, hashedToken, tokenExpiry } = user.genTempToken();
    user.emailVerifToken = hashedToken;
    user.emailVerifExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Verification of your email required",
        emailContent: verifyEmailTemplate(
            user.uname,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${rawToken}`
        )
    });

    return res
        .status(200)
        .json(
            new ServerResponse(
                200,
                null,
                "Verification email resent successfully."
            )
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
        throw new ServerError(
            401,
            "Unauthorized access! Refresh token is missing."
        );
    }

    try {
        const decoded = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await userModel.findById(decoded?.id);
        if (!user) {
            throw new ServerError(401, "Unauthorized access! User not found.");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ServerError(
                401,
                "Unauthorized access! Refresh token mismatch, or refresh token has expired."
            );
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await genARTokens(user.id);

        user.refreshAccessToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        const cookieOptions = { httpOnly: true, secure: true };

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(
                new ServerResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token have been refreshed."
                )
            );
    } catch (error) {
        console.error(error);
        throw new ServerError(
            401,
            "Unauthorized access! Invalid or expired refresh token."
        );
    }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
        throw new ServerError(404, "User does not exist", []);
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.genTempToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    await userModel.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Password reset request",
        mailgenContent: forgotPasswordTemplate(
            user.uname,
            `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
        )
    });

    return res
        .status(200)
        .json(
            new ServerResponse(
                200,
                null,
                "Password reset mail has been sent on your mail id"
            )
        );
});

const resetPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { newPasswd } = req.body;

    let hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    const user = await userModel.findOne({
        forgotPasswdToken: hashedToken,
        forgotPasswdExpiry: { $gt: Date.now() }
    });
    if (!user) {
        throw new ServerError(489, "Token is invalid or expired");
    }

    user.forgotPasswdExpiry = undefined;
    user.forgotPasswdToken = undefined;
    user.password = newPasswd;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ServerResponse(200, null, "Password reset successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPasswd, newPasswd } = req.body;

    const user = await userModel.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPasswd);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password");
    }

    user.passwd = newPasswd;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ServerResponse(200, null, "Password changed successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendVerificationEmail,
    refreshAccessToken,
    forgotPasswordRequest,
    resetPassword,
    changePassword
};
