const User = require("../models/User");
const bcrypt = require("bcryptjs");

const getMeService = async (userId) => {
    const user = await User.findById(userId).populate("role");
    if (!user) {
        throw new Error("User not found");
    }
    return {
        success: true,
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            username: user.username,
            email: user.email,
            role: user.role.name
        }
    };
};

const updateProfileService = async (userId, data) => {
    const { firstName, lastName, dateOfBirth, gender } = data;

    // Only allow updating specific fields to prevent email/username changes without verification
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).populate("role");
    
    if (!user) {
        throw new Error("User not found");
    }

    return {
        success: true,
        message: "Profile updated successfully",
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            username: user.username,
            email: user.email,
            role: user.role.name
        }
    };
};

const changePasswordService = async (userId, data) => {
    const { oldPassword, newPassword, confirmPassword } = data;

    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new Error("All password fields are required");
    }

    if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
    }

    // Check secure password constraints
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_.-])[A-Za-z\d@$!%*?&_.-]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        throw new Error("Password must be at least 8 characters and include 1 uppercase, 1 lowercase, 1 number, and 1 special character");
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
        throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        throw new Error("Incorrect old password");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return {
        success: true,
        message: "Password changed successfully"
    };
};

module.exports = { getMeService, updateProfileService, changePasswordService };
