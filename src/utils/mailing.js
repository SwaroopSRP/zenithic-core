import Mailgen from "mailgen";
import nodemailer from "nodemailer";

async function sendEmail(options) {
    const mailGenerator = new Mailgen({
        theme: "salted",
        product: {
            name: "Zenithic",
            link: "https://zenithic.in"
        }
    });

    const mailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_UNAME,
            pass: process.env.SMTP_PASS
        }
    });

    const email = {
        from: "noreply@zenithic.in",
        to: "options.email",
        subject: options.subject,
        text: mailGenerator.generatePlaintext(options.emailContent),
        html: mailGenerator.generate(options.emailContent)
    };

    try {
        await mailTransporter.sendMail(email);
    } catch (error) {
        console.error("Error occurred while attempting to send mail!");
        console.error("Error: ", error);
    }
}

const verifyEmailTemplate = (username, emailVerificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Thank you for signing-up with us!",
            action: {
                instructions:
                    "In order to complete the Sign-up process, we need you to get your email verified.",
                button: {
                    color: "#2ed573",
                    text: "Proceed to Email Verification",
                    link: emailVerificationUrl
                }
            },
            outro: "Facing any issues? Reach us out at support@zenithic.in"
        }
    };
};

const forgotPasswordTemplate = (username, passwordVerificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Let's get your password fixed.",
            action: {
                instructions:
                    "In order to proceed further, click below to get your request verified.",
                button: {
                    color: "#2ed573",
                    text: "Proceed to Verification",
                    link: passwordVerificationUrl
                }
            },
            outro: "Not you? Report this incident at report@zenithic.in"
        }
    };
};

export { sendEmail, verifyEmailTemplate, forgotPasswordTemplate };
