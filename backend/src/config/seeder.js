const mongoose = require("mongoose");
const Role = require("../models/Role");
require("dotenv").config();

const roles = [
    { name: "admin", description: "Administrator with full access" },
    { name: "student", description: "Student residing in the hostel" },
    { name: "guard", description: "Security guard managing hostel entry and exit" },
    { name: "manager", description: "Hostel manager overseeing operations" },
];

const seedRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // insert new roles
        await Role.insertMany(roles);
        console.log("✅ Roles seeded successfully");

        process.exit(0); // success
    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
        process.exit(1); // failure
    }
};

seedRoles();