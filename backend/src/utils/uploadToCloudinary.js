const cloudinary = require("../config/cloudinary");
const multer = require("multer");

// Use memory storage — file stays in memory as buffer, not saved to disk
const storage = multer.memoryStorage();

// Filter — only allow PDF and image files
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf", "application/octet-stream"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // accept file
    } else {
        cb(null, false); // reject file
    }
};

// Multer upload instance — max file size 5MB
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Function to upload buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
};

module.exports = { upload, uploadBufferToCloudinary };