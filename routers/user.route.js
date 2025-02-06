const { verifyToken } = require('./../middlewares/auth.js');
const userCtrl = require('./../controllers/user.controller.js');


const express = require('express');
const router = express.Router();

router.get('/all-users', verifyToken, userCtrl.getAllUsers);
router.post('/login', userCtrl.checkLogin); 


module.exports = router;