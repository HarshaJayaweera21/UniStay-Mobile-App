const LeavePass = require("../models/LeavePass");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary");

// Student uploads leave pass
const createLeavePassService = async (data, file) => {

    const { reason, requestedFrom, requestedTo } = data;
    const studentId = data.studentId;

    // Validate fields
    if (!reason || !requestedFrom || !requestedTo) {
        throw new Error("All fields are required");
    }

    // Validate dates
    if (new Date(requestedFrom) >= new Date(requestedTo)) {
        throw new Error("requestedFrom must be before requestedTo");
    }

    // Check file exists
    if (!file) {
        throw new Error("Leave pass document is required");
    }

    if (!file) {
        throw new Error("Leave pass document is required — only PDF, JPG and PNG are allowed");
    }

    // Upload document to Cloudinary — uses your "Leave_Pass_Docs" folder
    const uploadResult = await uploadBufferToCloudinary(file.buffer, "Leave_Pass_Docs");


    // Save leave pass to DB
    const leavePass = await LeavePass.create({
        student: studentId,
        documentUrl: uploadResult.secure_url,
        reason,
        requestedFrom: new Date(requestedFrom),
        requestedTo: new Date(requestedTo),
        status: "pending"
    });

    return {
        success: true,
        message: "Leave pass submitted successfully",
        data: leavePass
    };
};

// Manager gets all leave pass requests
const getAllLeavePassesService = async () => {
    const leavePasses = await LeavePass.find()
        .populate("student", "firstName lastName email username")
        .populate("reviewedBy", "firstName lastName")
        .sort({ createdAt: -1 }); // newest first

    return {
        success: true,
        data: leavePasses
    };
};

// Student gets own leave pass requests
const getMyLeavePassesService = async (studentId) => {
    const leavePasses = await LeavePass.find({ student: studentId })
        .sort({ createdAt: -1 });

    return {
        success: true,
        data: leavePasses
    };
};

// Manager approves leave pass
const approveLeavePassService = async (leavePassId, managerId) => {
    const leavePass = await LeavePass.findById(leavePassId);

    if (!leavePass) {
        throw new Error("Leave pass not found");
    }

    if (leavePass.status !== "pending") {
        throw new Error("Leave pass has already been reviewed");
    }

    leavePass.status = "approved";
    leavePass.reviewedBy = managerId;
    leavePass.reviewedAt = new Date();
    await leavePass.save();

    return {
        success: true,
        message: "Leave pass approved successfully",
        data: leavePass
    };
};

// Manager rejects leave pass
const rejectLeavePassService = async (leavePassId, managerId) => {
    const leavePass = await LeavePass.findById(leavePassId);

    if (!leavePass) {
        throw new Error("Leave pass not found");
    }

    if (leavePass.status !== "pending") {
        throw new Error("Leave pass has already been reviewed");
    }

    leavePass.status = "rejected";
    leavePass.reviewedBy = managerId;
    leavePass.reviewedAt = new Date();
    await leavePass.save();

    return {
        success: true,
        message: "Leave pass rejected successfully",
        data: leavePass
    };
};

// Manager deletes expired leave pass
const deleteLeavePassService = async (leavePassId) => {
    const leavePass = await LeavePass.findByIdAndDelete(leavePassId);

    if (!leavePass) {
        throw new Error("Leave pass not found");
    }

    return {
        success: true,
        message: "Leave pass deleted successfully"
    };
};

module.exports = {
    createLeavePassService,
    getAllLeavePassesService,
    getMyLeavePassesService,
    approveLeavePassService,
    rejectLeavePassService,
    deleteLeavePassService
};