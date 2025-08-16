import express from "express";
import cors from "cors";

const app = express();
export default app;

// Basic Middleware Configs
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// CORS Configs
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    })
);

app.get("/", (req, res) => {
    res.status(200).send(
        "Welcome! You are now accessing an instance of Zenithic's core."
    );
});
