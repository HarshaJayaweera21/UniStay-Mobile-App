const mongoose = require("mongoose");

const roomRequestSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
        },
        durationInMonths: {
            type: Number,
            required: true,
            min: 1,
        },
        keyMoneyAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "AgreementSent", "ReceiptUploaded", "Approved", "Rejected", "Cancelled"],
            default: "Pending",
        },
        cancellationRequested: {
            type: Boolean,
            default: false,
        },
        managerAgreementUrl: {
            type: String,
        },
        managerAgreementCloudinaryId: {
            type: String,
        },
        studentReceiptUrl: {
            type: String,
        },
        studentReceiptCloudinaryId: {
            type: String,
        },
        note: {
            type: String,
            trim: true,
        },
        reviewedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// A student can only have ONE active request (status: Pending, AgreementSent, ReceiptUploaded, or Approved)
roomRequestSchema.index({ studentId: 1, status: 1 });

const RoomRequest = mongoose.model("RoomRequest", roomRequestSchema);
module.exports = RoomRequest;
