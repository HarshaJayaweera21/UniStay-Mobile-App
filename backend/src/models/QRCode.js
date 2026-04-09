const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    qrData: {
        type: String,
        required: true,
        unique: true
    },
    qrCodeUrl: {
        type: String,
        required: true
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const QRCode = mongoose.model("QRCode", qrCodeSchema);
module.exports = QRCode;