const { verifyToken } = require('./../middlewares/auth.js');
const userCtrl = require('./../controllers/user.controller.js');
const multer = require('multer');


const express = require('express');
const router = express.Router();

const upload = multer().none();

router.get('/all-users', verifyToken, userCtrl.getAllUsers);
router.post('/login',upload , userCtrl.checkLogin); 
router.post('/register',upload , userCtrl.createUser); 


module.exports = router;