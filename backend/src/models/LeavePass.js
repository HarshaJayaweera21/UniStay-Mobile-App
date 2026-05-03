const mongoose = require("mongoose");

const leavePassSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    documentUrl: {
        type: String,
        required: true // Cloudinary URL of uploaded PDF or image
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    requestedFrom: {
        type: Date,
        required: true // start of requested time period
    },
    requestedTo: {
        type: Date,
        required: true // end of requested time period
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null // manager who reviewed
    },
    reviewedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const LeavePass = mongoose.model("LeavePass", leavePassSchema);
module.exports = LeavePass;