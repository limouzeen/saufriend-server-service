const express = require('express');
const router = express.Router();
const myfriendCtrl = require('../controllers/myfriend.controller');
const { verifyToken } = require('../middlewares/auth');

if (!myfriendCtrl.getAllFriends) {
    console.error("🚨 ERROR: getAllFriends function is missing in myfriend.controller.js");
}


router.get('/list', verifyToken, myfriendCtrl.getAllFriends);

module.exports = router;  






