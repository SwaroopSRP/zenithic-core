import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
    path: "./.env"
});

const port = process.env.PORT || 6969;

try {
    app.listen(port, () => {
        console.log(
            `Zenithic Core server up and listening on http://localhost:${port}`
        );
    });
} catch (error) {
    console.warn("Zenithic Core server failed to initialize!");
    console.error(error);
}
