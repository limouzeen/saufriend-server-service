const multer = require('multer');
const path = require('path');
const fs = require('fs');

//Ensure directories exist
const directories = ['images/user', 'images/myfriend'];
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
        /**
         * Specify the destination directory for uploaded files.
         * @param {Request} req The Express request object.
         * @param {File} file The file being uploaded.
         * @param {Function} cb The callback function to be called with the destination directory.
         * @returns {void}
         */

//Set up storage with dynamic destination
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'images/user'; // Default folder

        //Determine folder based on API route 
        if (req.baseUrl.includes('/myfriend')) {
            folder = 'images/myfriend';
        }

        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'img_' + uniqueSuffix + path.extname(file.originalname));
    }
});

//Set up file filter and size limits
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max size 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only images are allowed (JPEG, PNG, JPG)'));
        }
        cb(null, true);
    }
});

module.exports = upload;
