import ServerResponse from "../utils/api_response.js";
import asyncHandler from "../utils/async_handler.js";

const healthChecker = asyncHandler(async (req, res) => {
    res.status(200).send(
        new ServerResponse(200, {
            message: "Server up and running...",
            status: "UP"
        })
    );
});

export default healthChecker;
