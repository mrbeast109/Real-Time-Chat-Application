const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require('socket.io');
const cors = require("cors");
const connectDB = require("./config/db");
const userRouter = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

connectDB();
const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:5173']
    : ['http://localhost:5173', 'http://192.168.0.191:5173'];

const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: ALLOWED_ORIGINS,
        credentials: true,
    },
});

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send("API is Running");
});

app.use('/api/user', userRouter);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

app.use(notFound);
app.use(errorHandler);

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on("join chat", (room) => {
        socket.join(room);
    });

    socket.on("new message", (newMessage) => {
        const chat = newMessage.chat;
        if (!chat?.users) return;

        chat.users.forEach((user) => {
            if (user._id === newMessage.sender._id) return;
            socket.in(user._id).emit("message received", newMessage);
        });
    });

    socket.on("remove user", ({ removedUserId, chatId }) => {
        socket.in(removedUserId).emit("removed from group", chatId);
    });

    socket.on("add user", ({ addedUserId, chat }) => {
        socket.in(addedUserId).emit("added to group", chat);
    });

    socket.on("update group", (updatedChat) => {
        if (!updatedChat?.users) return;
        updatedChat.users.forEach(user => {
            socket.in(user._id).emit("group updated", updatedChat);
        });
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started at port ${PORT}`));