const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
    sendMessage,
    getMessages,
    unsendMessage,
    deleteForMe
} = require("../controllers/messageController");


router.post(
    "/send",
    auth,
    sendMessage
);


router.delete(
    "/:messageId/unsend",
    auth,
    unsendMessage
);


router.delete(
    "/:messageId/me",
    auth,
    deleteForMe
);


router.get(
    "/:userId",
    auth,
    getMessages
);


module.exports = router;