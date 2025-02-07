const { verifyToken } = require('./../middlewares/auth.js');
const userCtrl = require('./../controllers/user.controller.js');
const multer = require('multer');
const upload = require('./../middlewares/upload.js');


const express = require('express');
const router = express.Router();

const uploadOnlyText = multer().none();

router.get('/all-users', verifyToken, userCtrl.getAllUsers);
router.post('/login',uploadOnlyText , userCtrl.checkLogin); 
router.post('/register',upload.single('userImage') , userCtrl.createUser); 
router.put('/update-user', verifyToken, upload.single('userImage'), userCtrl.updateUser);
router.delete('/delete-user', verifyToken, userCtrl.deleteUser);

module.exports = router;