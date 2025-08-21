import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

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

const userModel = new mongoose.model("User", userSchema);
export default userModel;
