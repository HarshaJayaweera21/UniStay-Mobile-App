const RoomRequest = require("../models/RoomRequest");
const Room = require("../models/Room");
const Payment = require("../models/Payment");
const PaymentType = require("../models/PaymentType");
const cloudinary = require("../config/cloudinary");

// Student: Request a room
const createRoomRequest = async (req, res) => {
    try {
        const { roomId, durationInMonths } = req.body;
        const studentId = req.user.id;

        if (!roomId || !durationInMonths) {
            return res.status(400).json({ success: false, message: "Room ID and duration are required." });
        }

        // Check if student already has an active request
        const existingRequest = await RoomRequest.findOne({
            studentId,
            status: { $in: ["Pending", "AgreementSent", "ReceiptUploaded", "Approved"] }
        });

        if (existingRequest) {
            return res.status(400).json({ success: false, message: "You already have an active room request." });
        }

        // Check room availability
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found." });
        }

        if (room.availabilityStatus === "Full") {
            return res.status(400).json({ success: false, message: "This room is fully occupied." });
        }

        // Calculate key money (3 * monthly rent)
        const keyMoneyAmount = room.pricePerMonth * 3;

        const request = await RoomRequest.create({
            studentId,
            roomId,
            durationInMonths,
            keyMoneyAmount,
            status: "Pending"
        });

        res.status(201).json({ success: true, message: "Room requested successfully.", request });
    } catch (error) {
        console.error("createRoomRequest error:", error);
        res.status(500).json({ success: false, message: "Server error while requesting room." });
    }
};

// Student: Get my active request
const getMyRequest = async (req, res) => {
    try {
        const request = await RoomRequest.findOne({ studentId: req.user.id })
            .populate("roomId")
            .sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, request });
    } catch (error) {
        console.error("getMyRequest error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching your request." });
    }
};

// Manager: Get all requests
const getAllRequests = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.cancellations === 'true') {
            filter.cancellationRequested = true;
        }

        const requests = await RoomRequest.find(filter)
            .populate("studentId", "firstName lastName email username")
            .populate("roomId", "roomNumber roomType pricePerMonth")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: requests.length, requests });
    } catch (error) {
        console.error("getAllRequests error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching requests." });
    }
};

// Get single request by ID
const getRequestById = async (req, res) => {
    try {
        const request = await RoomRequest.findById(req.params.id)
            .populate("studentId", "firstName lastName email username")
            .populate("roomId", "roomNumber roomType pricePerMonth capacity currentOccupancy");

        if (!request) return res.status(404).json({ success: false, message: "Request not found." });

        res.status(200).json({ success: true, request });
    } catch (error) {
        console.error("getRequestById error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching request." });
    }
};

// Manager: Update simple status (e.g. Rejecting)
const updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["Rejected"].includes(status)) {
            // Usually, AgreementSent and Approved are handled via separate endpoints with file logic
            return res.status(400).json({ success: false, message: "Invalid simple status update." });
        }

        const request = await RoomRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Request not found." });

        request.status = status;
        request.reviewedAt = new Date();
        await request.save();

        res.status(200).json({ success: true, message: "Request rejected successfully.", request });
    } catch (error) {
        console.error("updateRequestStatus error:", error);
        res.status(500).json({ success: false, message: "Server error while updating request." });
    }
};

// Manager: Upload Agreement PDF
const uploadAgreement = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Agreement PDF is required." });
        }

        const request = await RoomRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Request not found." });

        if (request.managerAgreementCloudinaryId) {
            try { await cloudinary.uploader.destroy(request.managerAgreementCloudinaryId); } catch(e) {}
        }

        request.managerAgreementUrl = req.file.path;
        request.managerAgreementCloudinaryId = req.file.filename;
        request.status = "AgreementSent";
        await request.save();

        res.status(200).json({ success: true, message: "Agreement sent successfully.", request });
    } catch (error) {
        console.error("uploadAgreement error:", error);
        res.status(500).json({ success: false, message: "Server error while uploading agreement." });
    }
};

// Student: Upload Signed Agreement & Receipt
const uploadReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Receipt PDF is required." });
        }

        const request = await RoomRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Request not found." });

        if (request.studentId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        if (request.studentReceiptCloudinaryId) {
            try { await cloudinary.uploader.destroy(request.studentReceiptCloudinaryId); } catch(e) {}
        }

        request.studentReceiptUrl = req.file.path;
        request.studentReceiptCloudinaryId = req.file.filename;
        request.status = "ReceiptUploaded";
        await request.save();

        res.status(200).json({ success: true, message: "Receipt uploaded successfully.", request });
    } catch (error) {
        console.error("uploadReceipt error:", error);
        res.status(500).json({ success: false, message: "Server error while uploading receipt." });
    }
};

// Manager: Verify Receipt & Confirm Room
const verifyReceipt = async (req, res) => {
    try {
        const request = await RoomRequest.findById(req.params.id).populate("roomId");
        if (!request) return res.status(404).json({ success: false, message: "Request not found." });

        if (request.status !== "ReceiptUploaded") {
            return res.status(400).json({ success: false, message: "Receipt has not been uploaded yet." });
        }

        // 1. Mark request as Approved
        request.status = "Approved";
        request.reviewedAt = new Date();
        await request.save();

        // 2. Increment Room Occupancy
        const room = request.roomId;
        room.currentOccupancy += 1;
        await room.save();

        // 3. Create Key Money Payment record for auditing
        let keyMoneyType = await PaymentType.findOne({ name: { $regex: /key money/i } });
        if (!keyMoneyType) {
            keyMoneyType = await PaymentType.create({ name: "Key Money", description: "Initial deposit" });
        }

        await Payment.create({
            studentId: request.studentId,
            paymentType: keyMoneyType._id,
            amount: request.keyMoneyAmount,
            receipt: request.studentReceiptUrl,
            status: "Approved",
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
            note: "Key Money auto-verified via Room Request flow"
        });

        res.status(200).json({ success: true, message: "Room confirmed and receipt verified.", request });
    } catch (error) {
        console.error("verifyReceipt error:", error);
        res.status(500).json({ success: false, message: "Server error while verifying receipt." });
    }
};

// Student: Request Cancellation
const requestCancellation = async (req, res) => {
    try {
        const request = await RoomRequest.findOne({ studentId: req.user.id })
            .sort({ createdAt: -1 });

        if (!request) return res.status(404).json({ success: false, message: "No active request found." });

        if (request.status === "Cancelled" || request.status === "Rejected") {
            return res.status(400).json({ success: false, message: "Cannot cancel a request that is already cancelled or rejected." });
        }

        request.cancellationRequested = true;
        await request.save();

        res.status(200).json({ success: true, message: "Cancellation requested successfully.", request });
    } catch (error) {
        console.error("requestCancellation error:", error);
        res.status(500).json({ success: false, message: "Server error while requesting cancellation." });
    }
};

// Manager: Approve Cancellation
const approveCancellation = async (req, res) => {
    try {
        const request = await RoomRequest.findById(req.params.id).populate("roomId");
        if (!request) return res.status(404).json({ success: false, message: "Request not found." });

        if (!request.cancellationRequested) {
            return res.status(400).json({ success: false, message: "No cancellation request pending." });
        }

        // If the request was approved, we must free up the room
        if (request.status === "Approved") {
            const room = request.roomId;
            if (room && room.currentOccupancy > 0) {
                room.currentOccupancy -= 1;
                await room.save();
            }
        }

        request.status = "Cancelled";
        request.cancellationRequested = false;
        await request.save();

        res.status(200).json({ success: true, message: "Cancellation approved.", request });
    } catch (error) {
        console.error("approveCancellation error:", error);
        res.status(500).json({ success: false, message: "Server error while approving cancellation." });
    }
};

// Manager: Reject Cancellation
const rejectCancellation = async (req, res) => {
    try {
        const request = await RoomRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Request not found." });

        if (!request.cancellationRequested) {
            return res.status(400).json({ success: false, message: "No cancellation request pending." });
        }

        request.cancellationRequested = false;
        await request.save();

        res.status(200).json({ success: true, message: "Cancellation rejected.", request });
    } catch (error) {
        console.error("rejectCancellation error:", error);
        res.status(500).json({ success: false, message: "Server error while rejecting cancellation." });
    }
};

module.exports = {
    createRoomRequest,
    getMyRequest,
    getAllRequests,
    getRequestById,
    updateRequestStatus,
    uploadAgreement,
    uploadReceipt,
    verifyReceipt,
    requestCancellation,
    approveCancellation,
    rejectCancellation
};
