const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum:["male", "female", "other"],
        lowercase: true,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        lowercase: true,
        unique:true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique:true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false
    },
    profilePicture: {
        type: String,
        default: null
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        required: true
    }

}, {timestamps: true});

const User = mongoose.model("User", userSchema);
module.exports = User;
