import dotenv from "dotenv";
import dbConnect from "./config/db.js";
import app from "./app.js";

dotenv.config({
    path: "./.env"
});

const port = process.env.PORT || 6969;

dbConnect()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server up and running on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error("DB connection error: ", err);
    });
