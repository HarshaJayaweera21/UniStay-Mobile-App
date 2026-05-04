const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    roomType: {
        type: String,
        enum: ["Single", "Double", "Triple"],
        required: true
    },
    pricePerMonth: {
        type: Number,
        required: true,
        min: 0
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    currentOccupancy: {
        type: Number,
        default: 0,
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        default: ""
    },
    images: {
        type: [String],
        default: []
    },
    availabilityStatus: {
        type: String,
        enum: ["Available", "Full"],
        default: "Available"
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        required: true,
        default: "male"
    }
}, { timestamps: true });

// Auto-calculate availability before saving
roomSchema.pre("save", function () {
    this.availabilityStatus = this.currentOccupancy >= this.capacity ? "Full" : "Available";
});

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
