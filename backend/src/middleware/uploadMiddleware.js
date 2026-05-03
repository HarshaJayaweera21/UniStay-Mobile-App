const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "unistay/profiles",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 500, height: 500, crop: "limit" }]
    }
});

const uploadMiddleware = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = {uploadMiddleware, upload};
