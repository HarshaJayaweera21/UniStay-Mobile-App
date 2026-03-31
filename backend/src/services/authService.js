const User = require("../models/User");
const Role = require("../models/Role")
const bcrypt = require("bcrypt");

const registerUserService = async (data) => {
    const {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        username,
        email,
        password,
        confirmPassword
    } = data;

    if(!firstName || !lastName || !dateOfBirth || !gender || !username || !email || !password || !confirmPassword) {
        throw new Error("All fields are required");
    } else if (!(email.endsWith("@my.sliit.lk"))) {
        throw new Error("Email is not Valid");
    } else if (password !== confirmPassword) {
        throw new Error("Passwords doesn't match");
    }

    // check existing user
    const existingUser = await User.findOne({$or: [{email: email}, {username: username}]});

    if (existingUser) {
        if (existingUser.email === email) {
            throw new Error("Email already exists");
        }
        if (existingUser.username === username) {
            throw new Error("Username already exists");
        }
    }

    const allowedGenders = ["male", "female", "other"];
    if (!allowedGenders.includes(gender.toLowerCase())) {
        throw new Error("Invalid gender value");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get the default role (Student)
    const studentRole = await Role.findOne({name: "student"});
    if (!studentRole) {
        throw new Error("Default role not found");
    }

    // Create User
    const newUser = new User({
        firstName,
        lastName,
        dateOfBirth,
        gender,
        username,
        email,
        password: hashedPassword,
        role: studentRole._id
    });

    await newUser.save();

    return {
        success: true,
        message : "User Registered Successfully"
    }

}

module.exports = {registerUserService};