import ServerResponse from "../utils/api_response.js";

function healthChecker(req, res) {
    try {
        res.status(200).json(
            new ServerResponse(200, {
                info: "Server is running...",
                status: "UP"
            })
        );
    } catch (err) {
        console.error(err);
    }
}

export default healthChecker;
