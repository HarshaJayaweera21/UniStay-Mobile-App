const QRCode = require("../models/QRCode");

// GET own QR code — Student
const getMyQR = async (req, res) => {
    try {
        const qr = await QRCode.findOne({ student: req.user.id }).populate("student", "firstName lastName email");

        if (!qr) {
            return res.status(404).json({
                success: false,
                message: "QR code not found"
            });
        }

        res.status(200).json({
            success: true,
            qrCodeUrl: qr.qrCodeUrl,
            isApproved: qr.isApproved,
            student: qr.student
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET QR status of a student — Admin
const getQRStatus = async (req, res) => {
    try {
        const qr = await QRCode.findOne({ student: req.params.userId })
            .populate("student", "firstName lastName email");

        if (!qr) {
            return res.status(404).json({
                success: false,
                message: "QR code not found"
            });
        }

        res.status(200).json({
            success: true,
            data: qr
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { getMyQR, getQRStatus };