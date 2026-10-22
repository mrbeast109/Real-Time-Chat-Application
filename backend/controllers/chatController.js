const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const cloudinary = require('../config/cloudinary');

const accessChat = asyncHandler(async (req,res) => {
    const {userId} = req.body;

    if(!userId){
        console.log("UserId param not sent with request");
        return res.sendStatus(400);
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            {users: {$elemMatch:{$eq:req.user._id}}},
            {users: {$elemMatch:{$eq:userId}}}
        ],
    }).populate("users","-password")
      .populate("latestMessage");

        isChat = await User.populate(isChat, {
            path: 'latestMessage.sender',
            select: "name pic email",
        });

        if(isChat.length > 0){
            res.send(isChat[0]);
        }else{
            var chatData = {
                chatName : "sender",
                isGroupChat: false,
                users: [req.user._id, userId],
            };

            try {
                const createdChat = await Chat.create(chatData);
                const FullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password");
                res.status(200);
                res.send(FullChat);
            } catch (error) {
                res.status(400);
                throw new Error(error.message);
            }
        }
});

const fetchChats = asyncHandler(async (req,res) => {
    try{
        Chat.find({users: {$elemMatch:{$eq:req.user._id}}})
        .populate("users","--password")
        .populate("groupAdmin","--password")
        .populate("latestMessage")
        .sort({updatedAt: -1})
        .then(async (result) => {
            result = await User.populate(result,{
                path: "latestMessage.sender",
                select: "name pic email",
            });
            res.status(200);
            res.send(result);
        })
    }catch(error){
        res.status(400);
        throw new Error(error.message);
    }
});

const createGroupChat = asyncHandler(async (req,res) => {
    if(!req.body.users || !req.body.name){
        return res.status(400).send({message: "Please fill all the fields"});
    }

    var users = typeof req.body.users === 'string' ? JSON.parse(req.body.users) : req.body.users;

    if(users.length < 2){
        return res.status(400).send({message: "Please add more than 2 users to create a group chat"});
    }

    users.push(req.user);
    try{
        const groupChat = await Chat.create({
            chatName : req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,
        });
        const fullGroupChat = await Chat.findOne({_id: groupChat._id})
            .populate("users","-password")
            .populate("groupAdmin","-password");

            res.status(200).json(fullGroupChat);
    }catch(error){
        res.status(400);
        throw new Error(error.message);
    }
})
 
const renameGroup = asyncHandler(async (req,res) => {
    const {chatId, chatName} = req.body;
    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName,
        },
        {
            new: true,
        }
    )
        .populate("users","-password")
        .populate("groupAdmin","-password");

    if(!updatedChat){
        res.status(400);
        throw new Error("Failed to rename group");
    }else{
        res.status(200);
        res.json(updatedChat);
    }
})

const addToGroup = asyncHandler(async (req,res) => {
    const {chatId, userId} = req.body;

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: {users: userId},
        },
        {new: true}
    )
        .populate("users","-password")
        .populate("groupAdmin","-password");
    
        if(!added){
            res.status(400);
            throw new Error("Failed to add user to group");
        }else{
            res.status(200);
            res.json(added);
        }
})

const removeFromGroup = asyncHandler(async (req,res) => {
    const {chatId, userId}  = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404);
        throw new Error("Chat Not Found");
    }

    let update = { $pull: { users: userId } };
    
    if (chat.groupAdmin && chat.groupAdmin.toString() === userId.toString()) {
        const remainingUsers = chat.users.filter(u => u.toString() !== userId.toString());
        if (remainingUsers.length > 0) {
            update.$set = { groupAdmin: remainingUsers[0] };
        }
    }

    const remove = await Chat.findByIdAndUpdate(
        chatId,
        update,
        {new: true}
    )
        .populate("users","-password")
        .populate("groupAdmin","-password");

        if(!remove){
            res.status(400);
            throw new Error("Failed to remove from group");
        }else{
            res.status(200);
            res.json(remove);
        }
})

const updateGroupPic = asyncHandler(async (req, res) => {
    const { chatId } = req.body;
    if (!req.file) {
        res.status(400);
        throw new Error('No image provided');
    }
    const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'mychat_group_pics', resource_type: 'image' },
            (error, result) => { if (error) reject(error); else resolve(result); }
        );
        stream.end(req.file.buffer);
    });
    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { groupPic: result.secure_url },
        { new: true }
    ).populate('users', '-password').populate('groupAdmin', '-password');
    if (!updatedChat) {
        res.status(404);
        throw new Error('Chat not found');
    }
    res.json(updatedChat);
});

module.exports = { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup, updateGroupPic };