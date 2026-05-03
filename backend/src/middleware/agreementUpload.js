const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Configure Cloudinary storage for room request agreements and key money receipts
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "keymoney_receipts",
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    },
});

// File size limit: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "application/pdf",
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Invalid file type. Only JPG, JPEG, PNG, and PDF files are allowed."
                ),
                false
            );
        }
    },
});

// Error handling middleware for multer errors
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "File size exceeds the 5MB limit. Please upload a smaller file.",
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "File upload failed.",
        });
    }

    next();
};

module.exports = { upload, handleUploadError };
