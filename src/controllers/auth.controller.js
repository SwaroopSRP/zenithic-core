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

export { registerUser, loginUser };
