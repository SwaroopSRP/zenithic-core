import userModel from "../models/user.model.js";
import ServerError from "../utils/api_error.js";
import asyncHandler from "../utils/async_handler.js";
import jwt from "jsonwebtoken";

const verifyAccessToken = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
        throw new ServerError(
            401,
            "Unauthorized request! Access token is missing."
        );
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await userModel
            .findById(decoded.id)
            .select("-passwd -refreshToken -emailVerifToken -emailVerifExpiry");
        if (!user) {
            throw new ServerError(401, "Invalid access token!");
        }

        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        throw new ServerError(401, "Invalid access token!");
    }
});

export default verifyAccessToken;
