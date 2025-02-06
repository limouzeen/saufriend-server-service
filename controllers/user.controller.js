const User = require('./../models/user.model');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { where } = require('sequelize');
const { verifyToken } = require('./../middlewares/auth');


exports.checkLogin = async (req, res) => {
    try {
        const { userName, userPassword } = req.body;

        
        const user = await User.findOne({ where: { userName, userStatus: 1 } });

        if (!user) {
            return res.status(401).json({ message: '❌ Invalid username or password' });
        }

        // Compare entered password with hashed password
        const isPasswordValid = await bcrypt.compare(userPassword, user.userPassword);

        if (!isPasswordValid) {
            return res.status(401).json({ message: '❌ Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.userId, userName: user.userName },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '1h' }
        );

        res.json({ message: '✅ Login successful', token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { userStatus: 1 },
            attributes: { exclude: ['userPassword'] }
        });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
