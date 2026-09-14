const User = require("../models/User");

const onlineUsers = new Map();

const initializeSocket = (io) => {

    io.on("connection", (socket) => {

        console.log("Socket connected:", socket.id);


        // ==========================================
        // USER ONLINE
        // ==========================================

        socket.on("user-online", async (userId) => {

            try {

                onlineUsers.set(
                    userId,
                    socket.id
                );

                await User.findByIdAndUpdate(
                    userId,
                    {
                        isOnline: true
                    }
                );

                console.log(
                    "User online:",
                    userId
                );

                io.emit(
                    "online-users",
                    Array.from(
                        onlineUsers.keys()
                    )
                );

            } catch (error) {

                console.log(
                    "Online status error:",
                    error.message
                );

            }

        });


        // ==========================================
        // JOIN PERSONAL ROOM
        // ==========================================

        socket.on("join-room", (userId) => {

            socket.join(userId);

            console.log(
                `${userId} joined room`
            );

        });


        // ==========================================
        // SEND MESSAGE
        // ==========================================

        socket.on(
            "send-message",
            (message) => {

                const receiverId =
                    message.receiver?._id ||
                    message.receiver;

                const receiverSocketId =
                    onlineUsers.get(
                        String(receiverId)
                    );

                if (receiverSocketId) {

                    io.to(
                        receiverSocketId
                    ).emit(
                        "receive-message",
                        message
                    );

                }

            }
        );


        socket.on(
            "unsend-message",
            ({
                messageId,
                receiverId
            }) => {

                const receiverSocketId =
                    onlineUsers.get(
                        String(receiverId)
                    );

                if (receiverSocketId) {

                    io.to(
                        receiverSocketId
                    ).emit(
                        "message-unsent",
                        {
                            messageId
                        }
                    );

                }

            }
        );


        // ==========================================
        // TYPING
        // ==========================================

        socket.on(
            "typing",
            ({
                senderId,
                receiverId
            }) => {

                const receiverSocketId =
                    onlineUsers.get(
                        receiverId
                    );

                if (receiverSocketId) {

                    io.to(
                        receiverSocketId
                    ).emit(
                        "user-typing",
                        {
                            senderId
                        }
                    );

                }

            }
        );


        // ==========================================
        // STOP TYPING
        // ==========================================

        socket.on(
            "stop-typing",
            ({
                senderId,
                receiverId
            }) => {

                const receiverSocketId =
                    onlineUsers.get(
                        receiverId
                    );

                if (receiverSocketId) {

                    io.to(
                        receiverSocketId
                    ).emit(
                        "user-stop-typing",
                        {
                            senderId
                        }
                    );

                }

            }
        );


        // ==========================================
        // CALL USER
        // ==========================================

        socket.on(
            "call-user",
            ({
                to,
                from,
                callerName,
                callType
            }) => {

                const receiverSocketId =
                    onlineUsers.get(to);

                if (!receiverSocketId) {

                    socket.emit(
                        "user-offline"
                    );

                    return;

                }

                console.log(
                    "================================"
                );

                console.log(
                    "CALL USER"
                );

                console.log(
                    "From:",
                    from
                );

                console.log(
                    "To:",
                    to
                );

                console.log(
                    "Call Type:",
                    callType
                );

                console.log(
                    "================================"
                );


                io.to(
                    receiverSocketId
                ).emit(
                    "incoming-call",
                    {
                        from,
                        callerName,
                        callType:
                            callType === "video"
                                ? "video"
                                : "audio"
                    }
                );

            }
        );


        // ==========================================
        // OFFER
        // ==========================================

        socket.on(
            "offer",
            ({
                to,
                offer,
                callType
            }) => {

                const receiverSocketId =
                    onlineUsers.get(to);

                if (!receiverSocketId) {
                    return;
                }

                console.log(
                    "OFFER TYPE:",
                    callType
                );


                io.to(
                    receiverSocketId
                ).emit(
                    "offer",
                    {
                        offer,
                        callType:
                            callType === "video"
                                ? "video"
                                : "audio"
                    }
                );

            }
        );


        // ==========================================
        // ANSWER
        // ==========================================

        socket.on(
            "answer",
            ({
                to,
                answer
            }) => {

                const receiverSocketId =
                    onlineUsers.get(to);

                if (!receiverSocketId) {
                    return;
                }

                io.to(
                    receiverSocketId
                ).emit(
                    "answer",
                    {
                        answer
                    }
                );

            }
        );


        // ==========================================
        // ICE CANDIDATE
        // ==========================================

        socket.on(
            "ice-candidate",
            ({
                to,
                candidate
            }) => {

                const receiverSocketId =
                    onlineUsers.get(to);

                if (!receiverSocketId) {
                    return;
                }

                io.to(
                    receiverSocketId
                ).emit(
                    "ice-candidate",
                    {
                        candidate
                    }
                );

            }
        );


        // ==========================================
        // END CALL
        // ==========================================

        socket.on(
            "call-ended",
            ({ to }) => {

                const receiverSocketId =
                    onlineUsers.get(to);

                if (!receiverSocketId) {
                    return;
                }

                io.to(
                    receiverSocketId
                ).emit(
                    "call-ended"
                );

            }
        );


        // ==========================================
        // DISCONNECT
        // ==========================================

        socket.on(
            "disconnect",
            async () => {

                console.log(
                    "Socket disconnected:",
                    socket.id
                );

                for (
                    const [
                        userId,
                        socketId
                    ]
                    of onlineUsers.entries()
                ) {

                    if (
                        socketId === socket.id
                    ) {

                        onlineUsers.delete(
                            userId
                        );

                        try {

                            await User.findByIdAndUpdate(
                                userId,
                                {
                                    isOnline: false,
                                    lastSeen:
                                        new Date()
                                }
                            );

                        } catch (error) {

                            console.log(
                                "Offline status error:",
                                error.message
                            );

                        }


                        io.emit(
                            "online-users",
                            Array.from(
                                onlineUsers.keys()
                            )
                        );

                        break;

                    }

                }

            }
        );

    });

};

module.exports = initializeSocket;