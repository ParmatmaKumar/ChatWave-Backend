const Message = require("../models/Message");
const User = require("../models/User");

const formatMessage = (message) => {
    const data = message.toObject ? message.toObject() : { ...message };

    if (data.isUnsent) {
        data.text = "";
    }

    return data;
};


// SEND MESSAGE
exports.sendMessage = async (req, res) => {

    try {

        const {
            receiver,
            text
        } = req.body;

        if (!receiver || !text) {
            return res.status(400).json({
                success: false,
                message: "Receiver and text are required"
            });
        }

        const receiverUser = await User.findById(receiver);

        if (!receiverUser) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found"
            });
        }

        const message = await Message.create({
            sender: req.user.id,
            receiver,
            text
        });

        const populatedMessage = await Message
            .findById(message._id)
            .populate(
                "sender",
                "name email profilePicture"
            )
            .populate(
                "receiver",
                "name email profilePicture"
            );

        return res.status(201).json({
            success: true,
            message: populatedMessage
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// GET CHAT
exports.getMessages = async (req, res) => {

    try {

        const { userId } = req.params;

        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        {
                            sender: req.user.id,
                            receiver: userId
                        },
                        {
                            sender: userId,
                            receiver: req.user.id
                        }
                    ]
                },
                {
                    deletedFor: { $ne: req.user.id }
                }
            ]
        })
            .populate(
                "sender",
                "name email profilePicture"
            )
            .populate(
                "receiver",
                "name email profilePicture"
            )
            .sort({
                createdAt: 1
            });

        return res.status(200).json({
            success: true,
            messages: messages.map(formatMessage)
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// UNSEND — remove for everyone (sender only)
exports.unsendMessage = async (req, res) => {

    try {

        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        if (String(message.sender) !== String(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: "Only the sender can unsend this message"
            });
        }

        if (message.isUnsent) {
            return res.status(200).json({
                success: true,
                message: formatMessage(message)
            });
        }

        message.isUnsent = true;
        await message.save();

        const populatedMessage = await Message
            .findById(message._id)
            .populate("sender", "name email profilePicture")
            .populate("receiver", "name email profilePicture");

        return res.status(200).json({
            success: true,
            message: formatMessage(populatedMessage)
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// DELETE FOR ME — hide from current user only
exports.deleteForMe = async (req, res) => {

    try {

        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        const userId = String(req.user.id);
        const isParticipant =
            String(message.sender) === userId ||
            String(message.receiver) === userId;

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You cannot delete this message"
            });
        }

        await Message.findByIdAndUpdate(
            message._id,
            { $addToSet: { deletedFor: req.user.id } }
        );

        return res.status(200).json({
            success: true,
            messageId: message._id
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};