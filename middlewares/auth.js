// require('dotenv').config();
// const jwt = require('jsonwebtoken');

// exports.verifyToken = (req, res, next) => {
//     const token = req.header('Authorization');

//     if (!token) {
//         return res.status(401).json({ message: 'Access denied. No token provided.' });
//     }

//     try {
//         const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
//         req.user = decoded; // Store user data in `req`
//         next(); // Move to the next middleware
//     } catch (error) {
//         res.status(401).json({ message: 'Invalid token' });
//     }
// };


require('dotenv').config();
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    let token = req.header('Authorization'); //ดึง Token จาก Headers
    if (!token) {
        token = req.cookies?.token; //ดึง Token จาก HTTP-Only Cookie (ถ้ามี)
    }

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        //ลบ "Bearer " ออกถ้ามี (ในกรณีใช้ Header)
        token = token.replace("Bearer ", "");

        //ตรวจสอบความถูกต้องของ Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
        req.user = decoded; //เก็บข้อมูลผู้ใช้ใน `req.user`
        next(); //ดำเนินการต่อไปยัง Middleware/Controller ถัดไป
    } catch (error) {
        console.error("Token verification error:", error);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: " Token has expired" });
        } else if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: " Invalid token" });
        } else {
            return res.status(500).json({ message: " Internal server error", error: error.message });
        }
    }
};
