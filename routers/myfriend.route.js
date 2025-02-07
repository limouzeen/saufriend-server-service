const express = require('express');
const router = express.Router();
const myfriendCtrl = require('../controllers/myfriend.controller');
const { verifyToken } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

if (!myfriendCtrl.getAllFriends) {
    console.error("ERROR: getAllFriends function is missing in myfriend.controller.js");
}


router.get('/list', verifyToken, myfriendCtrl.getAllFriends);
router.post('/add-myfriend', verifyToken, upload.single('myfriendImage'), myfriendCtrl.createMyFriend);
router.put('/update', verifyToken, upload.single('myfriendImage'), myfriendCtrl.updateMyFriend);
router.delete('/delete-myfriend/:myfriendId', verifyToken, myfriendCtrl.deleteMyFriend);


module.exports = router;  






