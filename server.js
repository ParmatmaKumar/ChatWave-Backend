require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { Server } = require("socket.io");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");

const initializeSocket = require("./socket/socket");


const app = express();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";


// HTTP SERVER
const server = http.createServer(app);


// MIDDLEWARE
app.use(
    cors({
        origin: clientUrl,
        credentials: true
    })
);

app.use(express.json());

app.use(cookieParser());


// ROUTES
app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/messages",
    messageRoutes
);


// TEST ROUTE
app.get("/", (req, res) => {

    res.send(
        "WhatsApp Clone Backend Running"
    );

});


// SOCKET.IO
const io = new Server(
    server,
    {
        cors: {
            origin: clientUrl,
            methods: ["GET", "POST"],
            credentials: true
        }
    }
);


initializeSocket(io);


// START SERVER
const PORT =
    process.env.PORT || 8000;


const startServer = async () => {

    await connectDB();

    server.listen(
        PORT,
        () => {

            console.log(
                `Server running on port ${PORT}`
            );

        }
    );

};


startServer();