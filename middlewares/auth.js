require('dotenv').config();
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: '❌ Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.user = decoded; // Store user data in `req`
        next(); // Move to the next middleware
    } catch (error) {
        res.status(401).json({ message: '❌ Invalid token' });
    }
};
