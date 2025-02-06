const MyFriend = require('./../models/myfriend.model.js');
const User = require('./../models/user.model.js');
const multer = require('multer');

exports.getAllFriends = async (req, res) => {
    try {
        const friends = await MyFriend.findAll({
            include: [
                { model: User, attributes: ['userFullname', 'userEmail'] }
            ]
        });

        res.json(friends);
    } catch (error) {
        console.error("🚨 Error fetching friends:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
