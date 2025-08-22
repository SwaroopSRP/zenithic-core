import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const userSchema = new Schema({
    uname: {
        type: String,
        required: true,
        trim: true,
        minLength: 4,
        maxLength: 15,
        trim: true,
        index: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    fullName: { type: String, trim: true },
    passwd: { type: String, required: [true, "Password is mandatory!"] },
    profileImg: {
        type: { url: String, localPath: String },
        default: { url: "https://placehold.co/200x200//", localPath: "" }
    },
    isActive: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifToken: { type: String },
    emailVerifExpiry: { type: Date },
    refreshToken: { type: String },
    forgotPasswdToken: { type: String },
    forgotPasswdExpiry: { type: Date }
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("passwd")) return next();

    this.passwd = await bcrypt.hash(this.passwd, 10);
    next();
});

userSchema.methods.checkPassword = async function (inputPassword) {
    return await bcrypt.compare(candidatePassword, this.passwd);
};

userSchema.methods.genAccessToken = function () {
    return jwt.sign(
        { id: this._id, uname: this.uname, email: this.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

userSchema.methods.genRefreshToken = function () {
    return jwt.sign(
        { id: this._id, uname: this.uname },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

userSchema.methods.genTempToken = function () {
    const rawToken = crypto.randomBytes(16).toString("hex");
    const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
    const tokenExpiry = Date.now() + 10 * 60 * 1000; // 10m limit

    return { rawToken, hashedToken, tokenExpiry };
};

const userModel = new mongoose.model("User", userSchema);
export default userModel;
