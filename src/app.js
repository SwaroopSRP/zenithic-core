import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthCheckerRouter from "./routes/healthchecker.route.js";
import authRouter from "./routes/auth.route.js";

const app = express();
export default app;

// Basic Middleware Configs
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// CORS Configs
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    })
);

app.use("/api/v1/healthcheck", healthCheckerRouter);
app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
    res.status(200).send(
        "Welcome! You are now accessing an instance of Zenithic's core."
    );
});
