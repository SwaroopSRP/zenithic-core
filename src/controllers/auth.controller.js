import userModel from "../models/user.model.js";
import { sendEmail, verifyEmailTemplate } from "../utils/mailing.js";
import ServerResponse from "../utils/api_response.js";
import ServerError from "../utils/api_error.js";
import asyncHandler from "../utils/async_handler.js";

async function genARTokens(userId) {
    try {
        const user = userModel.findById(userId);
        const accessToken = user.genAccessToken();
        const refreshToken = user.genRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ServerError(
            500,
            "Error occurred while generating access token!"
        );
        console.error(error);
    }
}

function registerUser() {
    asyncHandler(async (req, res) => {
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
        const { unhashedToken, hashedToken, tokenExpiry } =
            userModel.genTempToken();
        user.emailVerifToken = hashedToken;
        user.emailVerifExpiry = tokenExpiry;
        await user.save({ validateBeforeSave: false });

        await sendEmail({
            email: user?.email,
            subject: "Verification of your email required",
            emailContent: verifyEmailTemplate(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`
            )
        });

        const createdUser = await userModel
            .findById(user._id)
            .select(
                "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
            );
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
}

export { registerUser };
