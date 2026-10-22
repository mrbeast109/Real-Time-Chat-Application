const express  = require('express');
const multer   = require('multer');
const { registerUser, authUser, allUsers, updateProfilePic } = require('../controllers/UserController');
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

router.route('/').post(upload.single('pic'), registerUser).get(protect, allUsers);
router.route('/login').post(authUser);
router.route('/pic').put(protect, upload.single('pic'), updateProfilePic);

module.exports = router;
