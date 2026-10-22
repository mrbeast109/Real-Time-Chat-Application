const asyncHandler = require('express-async-handler');
const Message = require('../models/msgModel');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');

const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId, isSystem } = req.body;

    if (!content || !chatId) {
        res.status(400);
        throw new Error('Content and chatId are required');
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404);
        throw new Error('Chat not found');
    }

    if (!isSystem && !chat.users.includes(req.user._id)) {
        res.status(403);
        throw new Error('You are no longer a member of this chat');
    }

    let message = await Message.create({
        sender: req.user._id,
        content,
        chat: chatId,
        isSystem: isSystem || false,
    });

    message = await message.populate('sender', 'name pic email');
    message = await message.populate('chat');
    message = await User.populate(message, {
        path: 'chat.users',
        select: 'name pic email',
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.status(201).json(message);
});

const allMessages = asyncHandler(async (req, res) => {
    const messages = await Message.find({ chat: req.params.chatId })
        .populate('sender', 'name pic email')
        .populate('chat');

    res.json(messages);
});

module.exports = { sendMessage, allMessages };
