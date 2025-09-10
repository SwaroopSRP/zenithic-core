import { validationResult } from "express-validator";
import ServerError from "../utils/api_error.js";

function validate(req, res, next) {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = [];
    errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

    throw new ServerError(422, "Received data is not valid!", extractedErrors);
}

export default validate;
