const mongoose = require("mongoose");

const roomRequestSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentItNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
      lowercase: true,
      trim: true,
    },
    yearOfStudy: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
      required: true,
      trim: true,
    },
    faculty: {
      type: String,
      enum: ["Faculty of Computing", "Faculty of Business Management", "Other"],
      required: true,
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: false,
    },
    roomType: {
      type: String,
      enum: ["single", "double"],
      required: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      lowercase: true,
      trim: true,
    },
    paymentProof: {
      type: String,
      default: null,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["bank-transfer", "cash", "other"],
      required: true,
      lowercase: true,
      trim: true,
    },
    // Guardian & Emergency Info
    guardianName: { type: String, trim: true },
    guardianContact: { type: String, trim: true },
    emergencyName: { type: String, trim: true },
    emergencyPhone: { type: String, trim: true },
    // Medical Information
    medicalConditions: { type: String, trim: true },
    allergies: { type: String, trim: true },
    medications: { type: String, trim: true },
  },
  { timestamps: true }
);

const RoomRequest = mongoose.model("RoomRequest", roomRequestSchema);
module.exports = RoomRequest;

