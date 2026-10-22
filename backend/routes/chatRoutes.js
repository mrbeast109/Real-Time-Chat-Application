const express = require('express');
const multer  = require('multer');
const { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup, updateGroupPic } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddlerware');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    },
});

router.route('/').post(protect, accessChat).get(protect, fetchChats);
router.route('/group').post(protect, createGroupChat);
router.route('/rename').put(protect, renameGroup);
router.route('/groupremove').put(protect, removeFromGroup);
router.route('/groupadd').put(protect, addToGroup);
router.route('/grouppic').put(protect, upload.single('pic'), updateGroupPic);

module.exports = router;