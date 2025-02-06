const User = require('./../models/user.model.js');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { where } = require('sequelize');
const { verifyToken } = require('./../middlewares/auth.js');



exports.checkLogin = async (req, res) => {
    try {
        console.log("🟢 Received request body:", req.body);

        const { userName, userPassword } = req.body;

        if (!userName || !userPassword) {
            console.log("❌ Missing username or password in request");
            return res.status(400).json({ message: "❌ Missing username or password" });
        }

        // ✅ ค้นหาผู้ใช้ในฐานข้อมูล
        const user = await User.findOne({ where: { userName, userStatus: 1 } });

        console.log("🔍 Checking user in DB:", user);

        if (!user) {
            return res.status(401).json({ message: '❌ Invalid username or password' });
        }

        // ✅ ตรวจสอบค่ารหัสผ่านที่ได้รับและรหัสผ่านที่เก็บในฐานข้อมูล
        console.log("🔑 Entered Password (User Input):", userPassword);
        console.log("🔑 Stored Hashed Password (From DB):", user.userPassword);

        // ✅ เปรียบเทียบรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(userPassword, user.userPassword);

        console.log("🔑 Password match:", isPasswordValid);

        if (!isPasswordValid) {
            return res.status(401).json({ message: '❌ Invalid username or password' });
        }

        // ✅ สร้าง Token
        const token = jwt.sign(
            { userId: user.userId, userName: user.userName },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '1h' }
        );

        console.log("✅ Login successful for:", userName);
        res.json({ message: '✅ Login successful', token, user });

    } catch (error) {
        console.error("🚨 Error in checkLogin:", error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
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


exports.createUser = async (req, res) => {
    try {
        console.log("🟢 Received request body:", req.body);

        const { userFullname, userEmail, userName, userPassword, userImage } = req.body;

        if (!userFullname || !userEmail || !userName || !userPassword || !userImage) {
            console.log("❌ Missing required fields in request");
            return res.status(400).json({ message: "❌ Please provide all required fields" });
        }

        // ✅ ตรวจสอบว่าชื่อผู้ใช้ซ้ำหรือไม่
        const existingUser = await User.findOne({ where: { userName } });
        if (existingUser) {
            return res.status(400).json({ message: "❌ Username already exists" });
        }

        // ✅ เข้ารหัสรหัสผ่านก่อนบันทึก
        const hashedPassword = await bcrypt.hash(userPassword, 10);
        console.log("✅ Hashed Password:", hashedPassword);

        // ✅ บันทึกลงฐานข้อมูล
        const newUser = await User.create({
            userFullname,
            userEmail,
            userName,
            userPassword: hashedPassword, // เก็บค่า Hash
            userImage,
            userStatus: 1
        });

        console.log(`🎉 User ${userName} created successfully!`);
        res.status(201).json({ message: "✅ User registered successfully", user: newUser });

    } catch (error) {
        console.error("🚨 Error creating user:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};