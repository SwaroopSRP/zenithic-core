import { body } from "express-validator";

function applyRegistrationValidations() {
    return [
        body("uname")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isString()
            .withMessage("Username must be a string")
            .isLength({ min: 4, max: 30 })
            .withMessage("Username must be between 3 and 30 characters"),
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email must be valid"),
        body("passwd")
            .trim()
            .notEmpty()
            .withMessage("Password is required")
            .isStrongPassword({
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1
            })
            .withMessage(
                "Password must be at least 8 characters long and include at least one lowercase letter, one uppercase letter, one number, and one symbol"
            ),
        body("fullName")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Full name can't be empty")
            .isString()
            .withMessage("Full name must be a string")
            .isLength({ min: 2, max: 100 })
            .withMessage("Full name must be between 2 and 100 characters")
    ];
}

function applyLoginValidations() {
    return [
        body("uname").trim().notEmpty().withMessage("Username is required"),
        body("passwd").trim().notEmpty().withMessage("Password is required")
    ];
}

export { applyRegistrationValidations, applyLoginValidations };
