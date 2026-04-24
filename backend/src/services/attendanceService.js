const AttendanceLog = require("../models/AttendanceLog");
const QRCode = require("../models/QRCode");
const LeavePass = require("../models/LeavePass");
const User = require("../models/User");

const verifyQRService = async (qrData) => {
    if (!qrData) {
        throw new Error("QR data is required");
    }

    const qr = await QRCode.findOne({ qrData }).populate("student");
    if (!qr) {
        throw new Error("Invalid QR code");
    }

    if (!qr.isApproved) {
        throw new Error("Student QR code is not approved yet");
    }

    const student = qr.student;
    const now = new Date();

    const hours = now.getHours();
    const isAllowedTime = hours >= 6 && hours < 18;

    let accessGranted = false;
    let leavePassRef = null;

    if (isAllowedTime) {
        accessGranted = true;
    } else {
        const leavePass = await LeavePass.findOne({
            student: student._id,
            status: "approved",
            requestedFrom: { $lte: now },
            requestedTo: { $gte: now }
        });

        if (leavePass) {
            accessGranted = true;
            leavePassRef = leavePass._id;
        } else {
            accessGranted = false;
        }
    }

    return {
        success: true,
        accessGranted,
        message: accessGranted
            ? `Access granted`
            : "Access denied — outside allowed hours and no approved leave pass",
        data: {
            studentId: student._id,
            studentName: `${student.firstName} ${student.lastName}`,
            timestamp: now,
            isAllowedTime,
            accessGranted
        }
    };
};

const scanQRService = async (data) => {
    const { qrData, type, guardId } = data;

    // Validate fields
    if (!qrData || !type) {
        throw new Error("QR data and type are required");
    }

    if (!["entry", "exit"].includes(type)) {
        throw new Error("Type must be entry or exit");
    }

    // Find QR code in DB
    const qr = await QRCode.findOne({ qrData }).populate("student");
    if (!qr) {
        throw new Error("Invalid QR code");
    }

    // Check if QR is approved
    if (!qr.isApproved) {
        throw new Error("Student QR code is not approved yet");
    }

    const student = qr.student;
    const now = new Date();

    // Check if current time is within allowed hours (6AM - 6PM)
    const hours = now.getHours();
    const isAllowedTime = hours >= 6 && hours < 18;

    let accessGranted = false;
    let leavePassRef = null;

    if (isAllowedTime) {
        // Within normal hours — always grant access
        accessGranted = true;
    } else {
        // Outside normal hours — check for approved leave pass
        const leavePass = await LeavePass.findOne({
            student: student._id,
            status: "approved",
            requestedFrom: { $lte: now },
            requestedTo: { $gte: now }
        });

        if (leavePass) {
            accessGranted = true;
            leavePassRef = leavePass._id;
        } else {
            accessGranted = false;
        }
    }

    // Save attendance log
    const log = await AttendanceLog.create({
        student: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        scannedBy: guardId,
        type,
        timestamp: now,
        isAllowedTime,
        leavePass: leavePassRef,
        accessGranted
    });

    return {
        success: true,
        accessGranted,
        message: accessGranted
            ? `Access granted — ${type} recorded`
            : "Access denied — outside allowed hours and no approved leave pass",
        data: {
            studentName: `${student.firstName} ${student.lastName}`,
            type,
            timestamp: now,
            isAllowedTime,
            accessGranted
        }
    };
};

// Get all attendance logs
const getAllLogsService = async () => {
    const logs = await AttendanceLog.find()
        .populate("student", "firstName lastName email username")
        .populate("scannedBy", "firstName lastName")
        .populate("leavePass")
        .sort({ timestamp: -1 });

    return { success: true, data: logs };
};

// Get logs for a specific student
const getStudentLogsService = async (studentId) => {
    const logs = await AttendanceLog.find({ student: studentId })
        .populate("scannedBy", "firstName lastName")
        .sort({ timestamp: -1 });

    return { success: true, data: logs };
};

// Get own logs — Student
const getMyLogsService = async (studentId) => {
    const logs = await AttendanceLog.find({ student: studentId })
        .sort({ timestamp: -1 });

    return { success: true, data: logs };
};

module.exports = {
    verifyQRService,
    scanQRService,
    getAllLogsService,
    getStudentLogsService,
    getMyLogsService
};