const mongoose = require("mongoose");

const attendanceLogSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    scannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["entry", "exit"],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isAllowedTime: {
        type: Boolean,
        required: true
    },
    leavePass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LeavePass",
        default: null
    },
    accessGranted: {
        type: Boolean,
        required: true
    }
}, { timestamps: true });

const AttendanceLog = mongoose.model("AttendanceLog", attendanceLogSchema);
module.exports = AttendanceLog;