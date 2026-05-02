const User = require("../models/User");
const Role = require("../models/Role")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

    // Check secure password constraints
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_.-])[A-Za-z\d@$!%*?&_.-]{8,}$/;
    if (!passwordRegex.test(password)) {
        throw new Error("Password must be at least 8 characters and include 1 uppercase, 1 lowercase, 1 number, and 1 special character");
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

const loginUserService = async (data) => {
    const {email, password} = data;

    if (!email || !password) {
        throw new Error("Email and Password are required");
    }

    const user = await User.findOne({email})
        .select("+password")
        .populate("role");
    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        throw new Error("Invalid Email or Password");
    }

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role.name
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );

    return {
        success: true,
        message: "Login Successful",
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role.name
        }
    }
}

module.exports = {registerUserService, loginUserService};