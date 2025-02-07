const MyFriend = require('./../models/myfriend.model.js');
const User = require('./../models/user.model.js');
const fs = require('fs');
const path = require('path');
const sequelize = require('./../db/db.js');


exports.getAllFriends = async (req, res) => {
    try {
        const friends = await MyFriend.findAll({
            include: [{ model: User, attributes: ['userFullname', 'userEmail'] }]
        });

        res.json(friends);
    } catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.createMyFriend = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        console.log("Received request body:", req.body);

        const { myfriendFullname, myfriendPhone, myfriendAge, myfriendMajor } = req.body;
        const userId = req.user.userId; // Get userId from `verifyToken`
        let myfriendImage = req.file ? req.file.filename : 'default.jpg';

        if (!myfriendFullname || !myfriendPhone || !myfriendAge || !myfriendMajor) {
            console.log("Missing required fields");
            
            //Ensure uploaded image is deleted if request is invalid
            if (req.file) {
                const uploadedImagePath = path.join(__dirname, '../images/myfriend/', req.file.filename);
                if (fs.existsSync(uploadedImagePath)) {
                    try {
                        fs.unlinkSync(uploadedImagePath);
                        console.log(`Deleted uploaded file: ${req.file.filename}`);
                    } catch (unlinkError) {
                        console.error(`Error deleting uploaded file: ${unlinkError.message}`);
                    }
                }
            }

            return res.status(400).json({ message: "Please provide all required fields" });
        }

        //Check for duplicate values
        const existingFriend = await MyFriend.findOne({ where: { myfriendFullname, userId } });
        const existingPhone = await MyFriend.findOne({ where: { myfriendPhone } });

        if (existingFriend || existingPhone) {
            console.log("Duplicate friend or phone number detected");

            //Ensure uploaded image is deleted if validation fails
            if (req.file) {
                const uploadedImagePath = path.join(__dirname, '../images/myfriend/', req.file.filename);
                if (fs.existsSync(uploadedImagePath)) {
                    try {
                        fs.unlinkSync(uploadedImagePath);
                        console.log(`Deleted uploaded file: ${req.file.filename}`);
                    } catch (unlinkError) {
                        console.error(`Error deleting uploaded file: ${unlinkError.message}`);
                    }
                }
            }

            let errorMessage = "Error: ";
            if (existingFriend) errorMessage += `The friend '${myfriendFullname}' already exists for this user. `;
            if (existingPhone) errorMessage += `The phone number '${myfriendPhone}' is already in use.`;

            return res.status(400).json({ message: errorMessage.trim() });
        }

        // Create new friend
        const newFriend = await MyFriend.create({
            myfriendFullname,
            myfriendPhone,
            myfriendAge,
            myfriendMajor,
            myfriendImage,
            userId
        }, { transaction });

        await transaction.commit();
        console.log(`Friend ${myfriendFullname} added successfully!`);
        res.status(201).json({ message: "Friend added successfully", myfriend: newFriend });

    } catch (error) {
        await transaction.rollback();

        console.error("Error adding myfriend:", error);
        
        //Ensure uploaded image is deleted if database operation fails
        if (req.file) {
            const uploadedImagePath = path.join(__dirname, '../images/myfriend/', req.file.filename);
            if (fs.existsSync(uploadedImagePath)) {
                try {
                    fs.unlinkSync(uploadedImagePath);
                    console.log(`Deleted uploaded file: ${req.file.filename}`);
                } catch (unlinkError) {
                    console.error(`Error deleting uploaded file: ${unlinkError.message}`);
                }
            }
        }

        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


// DELETE 
exports.deleteMyFriend = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        console.log("Received request to delete myfriendId:", req.params);
        const { myfriendId } = req.params;
        const userId = req.user.userId; // รับ userId จาก `verifyToken`

        // ตรวจสอบว่าพารามิเตอร์ถูกส่งมาหรือไม่
        if (!myfriendId || isNaN(myfriendId)) {
            console.log("Invalid request: Missing or invalid myfriendId");
            return res.status(400).json({ message: "Missing or invalid myfriendId" });
        }

        //ตรวจสอบว่าเพื่อนนี้เป็นของผู้ใช้ที่ล็อกอินอยู่หรือไม่
        const myfriend = await MyFriend.findOne({ where: { myfriendId, userId } });

        if (!myfriend) {
            console.log("Friend not found or unauthorized to delete");
            return res.status(404).json({ message: "Friend not found or unauthorized" });
        }

        //ลบรูปถ้าไม่ใช่ `default.jpg`
        const friendImage = myfriend.myfriendImage;
        if (friendImage && friendImage !== 'default.jpg') {
            const imagePath = path.join(__dirname, '../images/myfriend/', friendImage);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`🗑️ Deleted myfriend image: ${friendImage}`);
            }
        }

        // ลบข้อมูลเพื่อนจากฐานข้อมูล
        await MyFriend.destroy({ where: { myfriendId }, transaction });

        await transaction.commit();
        console.log(`Friend ${myfriendId} deleted successfully!`);
        return res.status(200).json({ message: "Friend deleted successfully" });

    } catch (error) {
        await transaction.rollback();

        console.error("Error deleting myfriend:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};



exports.updateMyFriend = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        console.log("Received request body:", req.body);

        const { myfriendId, myfriendFullname, myfriendPhone, myfriendAge, myfriendMajor } = req.body;
        const userId = req.user.userId; // Get userId from `verifyToken`
        const myfriend = await MyFriend.findByPk(myfriendId);

        if (!myfriend) {
            console.log("Friend not found");
            await deleteUploadedFile(req.file);
            return res.status(404).json({ message: "Friend not found" });
        }

        let oldImage = myfriend.myfriendImage;
        let newImage = req.file ? req.file.filename : oldImage;

        //ลบรูปเก่า ถ้ามีการอัปโหลดรูปใหม่
        if (req.file && oldImage !== 'default.jpg' && newImage !== oldImage) {
            await deleteFile(path.join(__dirname, '../images/myfriend/', oldImage));
        }

        //เช็คชื่อซ้ำเฉพาะถ้ามีการเปลี่ยนชื่อ
        if (myfriendFullname !== myfriend.myfriendFullname) {
            const existingFriend = await MyFriend.findOne({ where: { myfriendFullname, userId } });
            if (existingFriend) {
                console.log(`Friend name '${myfriendFullname}' already exists.`);
                await deleteUploadedFile(req.file);
                return res.status(400).json({ message: `Friend '${myfriendFullname}' already exists.` });
            }
        }

        //เช็คเบอร์โทรซ้ำเฉพาะถ้ามีการเปลี่ยนเบอร์
        if (myfriendPhone !== myfriend.myfriendPhone) {
            const existingPhone = await MyFriend.findOne({ where: { myfriendPhone } });
            if (existingPhone) {
                console.log(`Phone number '${myfriendPhone}' already exists.`);
                await deleteUploadedFile(req.file);
                return res.status(400).json({ message: `Phone number '${myfriendPhone}' is already in use.` });
            }
        }

        //อัปเดตข้อมูลเพื่อน
        await MyFriend.update(
            {
                myfriendFullname: myfriendFullname || myfriend.myfriendFullname,
                myfriendPhone: myfriendPhone || myfriend.myfriendPhone,
                myfriendAge: myfriendAge || myfriend.myfriendAge,
                myfriendMajor: myfriendMajor || myfriend.myfriendMajor,
                myfriendImage: newImage
            },
            { where: { myfriendId }, transaction }
        );

        await transaction.commit();
        console.log(`Friend ${myfriendId} updated successfully!`);
        return res.status(200).json({ message: "Friend updated successfully" });

    } catch (error) {
        await transaction.rollback();
        console.error("Error updating myfriend:", error);
        await deleteUploadedFile(req.file);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

//ฟังก์ชันช่วยลบไฟล์ที่อัปโหลดหากเกิดปัญหา
async function deleteUploadedFile(file) {
    if (file) {
        await deleteFile(path.join(__dirname, '../images/myfriend/', file.filename));
    }
}

//ฟังก์ชันช่วยลบไฟล์ (ใช้ async)
async function deleteFile(filePath) {
    console.log(`Checking file: ${filePath}`);
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (!err) {
                console.log(`Deleted file: ${filePath}`);
            } else {
                console.error(`Error deleting file: ${err.message}`);
            }
        });
    } else {
        console.log(`File does not exist: ${filePath}`);
    }
}