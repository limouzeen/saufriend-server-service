const User = require('./../models/user.model.js');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { where } = require('sequelize');
const { verifyToken } = require('./../middlewares/auth.js');
const sequelize = require('./../db/db.js');


exports.checkLogin = async (req, res) => {
    try {
        console.log("Received request body:", req.body);

        const { userName, userPassword } = req.body;

        if (!userName || !userPassword) {
            console.log("Missing username or password in request");
            return res.status(400).json({ message: "Missing username or password" });
        }

        // ค้นหาผู้ใช้ในฐานข้อมูล
        const user = await User.findOne({ where: { userName, userStatus: 1 } });

        console.log("Checking user in DB:", user);

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // ตรวจสอบค่ารหัสผ่านที่ได้รับและรหัสผ่านที่เก็บในฐานข้อมูล
        console.log("Entered Password (User Input):", userPassword);
        console.log("Stored Hashed Password (From DB):", user.userPassword);

        // เปรียบเทียบรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(userPassword, user.userPassword);

        console.log("Password match:", isPasswordValid);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // สร้าง Token
        const token = jwt.sign(
            { userId: user.userId, userName: user.userName },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '1h' }
        );

        console.log("Login successful for:", userName);
        res.json({ message: 'Login successful', token, user });

    } catch (error) {
        console.error("Error in checkLogin:", error);
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
    const transaction = await sequelize.transaction(); //ใช้ Transaction ป้องกันปัญหาข้อมูลผิดพลาด

    try {
        console.log("Received request body:", req.body);

        const { userFullname, userEmail, userName, userPassword } = req.body;
        let userImage = req.file ? req.file.filename : 'default.jpg'; //ใช้รูป `default.jpg` ถ้าไม่มีอัปโหลด

        //ตรวจสอบว่าข้อมูลครบถ้วนหรือไม่
        if (!userFullname || !userEmail || !userName || !userPassword) {
            console.log("Missing required fields in request");
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        //ตรวจสอบว่าอีเมลถูกใช้ไปแล้วหรือยัง
        const existingEmail = await User.findOne({ where: { userEmail } });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }

        //ตรวจสอบว่าชื่อผู้ใช้ถูกใช้ไปแล้วหรือยัง
        const existingUser = await User.findOne({ where: { userName } });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        //เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(userPassword, 10);
        console.log("Hashed Password:", hashedPassword);

        //บันทึกข้อมูลผู้ใช้ลงในฐานข้อมูล
        const newUser = await User.create(
            {
                userFullname,
                userEmail,
                userName,
                userPassword: hashedPassword,
                userImage,
                userStatus: 1
            },
            { transaction } //ใช้ transaction เพื่อให้แน่ใจว่าข้อมูลถูกต้อง
        );

        await transaction.commit(); //บันทึกข้อมูลเมื่อทุกอย่างถูกต้อง
        console.log(`User ${userName} created successfully!`);

        res.status(201).json({
            message: "User registered successfully",
            user: newUser
        });

    } catch (error) {
        await transaction.rollback(); //ยกเลิกการเปลี่ยนแปลงหากมีข้อผิดพลาด

        console.error("Error creating user:", error);

        // ลบไฟล์ที่อัปโหลดออกถ้าสร้างบัญชีไม่สำเร็จ
        if (req.file) {
            const uploadedImagePath = path.join(__dirname, '../images/user/', req.file.filename);
            if (fs.existsSync(uploadedImagePath)) {
                fs.unlinkSync(uploadedImagePath);
                console.log(`🗑️ Deleted uploaded file: ${req.file.filename}`);
            }
        }

        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


exports.updateUser = async (req, res) => {
    const transaction = await sequelize.transaction(); //ใช้ Transaction ป้องกันข้อมูลผิดพลาด

    try {
        console.log("Received request body:", req.body);

        const userId = req.user.userId; //ดึง userId จาก `verifyToken`
        const { userFullname, userEmail, userName, userPassword } = req.body;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let oldImage = user.userImage;
        let newImage = req.file ? req.file.filename : oldImage;
        

        if(newImage) {
            if(newImage !== oldImage) {
                const oldImagePath = path.join(__dirname, '../images/user/', oldImage);
                if(fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log(`Deleted old image: ${oldImage}`);
                }

            }else{
                newImage = oldImage;
            }
        }

        //ตรวจสอบว่ามีการเปลี่ยน `userEmail` หรือไม่
        if (userEmail && userEmail !== user.userEmail) {
            const existingEmail = await User.findOne({ where: { userEmail } });
            if (existingEmail) {
                return res.status(400).json({ message: "Email is already taken" });
            }
        }

        // ตรวจสอบว่ามีการเปลี่ยน `userName` หรือไม่
        if (userName && userName !== user.userName) {
            const existingUserName = await User.findOne({ where: { userName } });
            if (existingUserName) {
                return res.status(400).json({ message: " Username is already taken" });
            }
        }

        //ถ้ามีการเปลี่ยนรหัสผ่าน ให้เข้ารหัสใหม่
        let hashedPassword = user.userPassword;
        if (userPassword) {
            hashedPassword = await bcrypt.hash(userPassword, 10);
        }

        //อัปเดตข้อมูลผู้ใช้ในฐานข้อมูล
        await User.update(
            {
                userFullname: userFullname || user.userFullname,
                userEmail: userEmail || user.userEmail,
                userName: userName || user.userName,
                userPassword: hashedPassword,
                userImage: newImage,
            },
            { where: { userId }, transaction }
        );

        await transaction.commit(); //ยืนยันการอัปเดต
        console.log(`User ${userId} updated successfully!`);

        res.status(200).json({ message: "User updated successfully" });

    } catch (error) {
        await transaction.rollback(); //ยกเลิกการอัปเดตหากเกิดปัญหา
        console.error("Error updating user:", error);

        //ลบไฟล์ที่อัปโหลดออก ถ้าการอัปเดตไม่สำเร็จ
        if (req.file) {
            const uploadedImagePath = path.join(__dirname, '../images/user/', req.file.filename);
            if (fs.existsSync(uploadedImagePath)) {
                fs.unlinkSync(uploadedImagePath);
                console.log(`Deleted uploaded file: ${req.file.filename}`);
            }
        }

        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
exports.logout = (req, res) => {
    res.clearCookie("token"); //ล้าง Cookie ออกจาก Client
    res.json({ message: "Logout successful" });
};



exports.deleteUser = async (req, res) => {
    const transaction = await sequelize.transaction(); //Start a transaction

    try {
        console.log("Received request to delete user:", req.user.userId);
        const userId = req.user.userId; //Extract user ID from `verifyToken`
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        //Delete user's profile image (unless it's `default.jpg`)
        const userImage = user.userImage;
        if (userImage && userImage !== 'default.jpg') {
            const imagePath = path.join(__dirname, '../images/user/', userImage);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`Deleted user image: ${userImage}`);
            }
        }

        //Delete user from database
        await User.destroy({ where: { userId }, transaction });

        await transaction.commit(); //Commit transaction if everything succeeds
        console.log(`User ${userId} deleted successfully!`);

        res.status(200).json({ message: "User deleted successfully" });

    } catch (error) {
        await transaction.rollback(); //Rollback transaction on failure
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};





