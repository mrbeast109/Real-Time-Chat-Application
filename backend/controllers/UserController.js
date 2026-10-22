const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const generateToken = require('../config/generateToken');
const cloudinary = require('../config/cloudinary');

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please enter all the fields');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    let picUrl;
    if (req.file) {
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'mychat_avatars', resource_type: 'image' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });
        picUrl = result.secure_url;
    }

    const user = await User.create({
        name,
        email,
        password,
        ...(picUrl && { pic: picUrl }),
    });

    if (user) {
        res.status(201).json({
            _id:   user._id,
            name:  user.name,
            email: user.email,
            pic:   user.pic,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Failed to create user');
    }
});

const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id:   user._id,
            name:  user.name,
            email: user.email,
            pic:   user.pic,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

const allUsers = asyncHandler(async (req,res) => {
    const keyword = req.query.search ? {
        $or: [
            {name: {$regex: req.query.search, $options: 'i'}},
            {email: {$regex: req.query.search, $options: 'i'}},
        ],
    } : {};
    
    const users = await User.find(keyword).find({_id:{$ne:req.user._id}});
    res.send(users);
});

const updateProfilePic = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No image provided');
    }
    const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'mychat_avatars', resource_type: 'image' },
            (error, result) => { if (error) reject(error); else resolve(result); }
        );
        stream.end(req.file.buffer);
    });
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { pic: result.secure_url },
        { new: true }
    ).select('-password');
    res.json({
        _id:   user._id,
        name:  user.name,
        email: user.email,
        pic:   user.pic,
        token: generateToken(user._id),
    });
});

module.exports = { registerUser, authUser, allUsers, updateProfilePic };