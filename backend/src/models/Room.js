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
        min: [1, "Price must be greater than 0"],
        max: [30000, "Price cannot exceed Rs. 30,000"]
    },
    capacity: {
        type: Number,
        required: true,
        min: [1, "Capacity must be at least 1"],
        max: [3, "Capacity cannot exceed 3"]
    },
    currentOccupancy: {
        type: Number,
        default: 0,
        min: 0
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, "Description cannot exceed 200 characters"]
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
