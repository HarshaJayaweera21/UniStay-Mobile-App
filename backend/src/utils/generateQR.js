const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("../config/cloudinary");

const generateAndUploadQR = async (studentId) => {
    // Generate unique string for the student
    const qrData = `unistay-${studentId}-${uuidv4()}`;

    // Generate QR code as base64 image
    const qrBase64 = await QRCode.toDataURL(qrData);

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(qrBase64, {
        folder: "QR_Images",
        public_id: `qr_${studentId}`,
        overwrite: true
    });

    return {
        qrData,
        qrCodeUrl: uploadResult.secure_url
    };
};

module.exports = generateAndUploadQR;