const mongoose = require("mongoose");
const Role = require("../models/Role");
const PaymentType = require("../models/PaymentType");
require("dotenv").config();

const roles = [
    { name: "admin", description: "Administrator with full access" },
    { name: "student", description: "Student residing in the hostel" },
    { name: "guard", description: "Security guard managing hostel entry and exit" },
    { name: "manager", description: "Hostel manager overseeing operations" },
];

const paymentTypes = [
    { name: "Hostel Fee", description: "Monthly hostel accommodation fee" },
    { name: "Fine", description: "Penalty charges for rule violations" },
    { name: "Advance", description: "Advance payment for hostel reservation" },
    { name: "Maintenance Fee", description: "Fee for hostel maintenance and repairs" },
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Seed roles (idempotent — upsert to avoid duplicates)
        for (const role of roles) {
            await Role.updateOne(
                { name: role.name },
                { $setOnInsert: role },
                { upsert: true }
            );
        }
        console.log("✅ Roles seeded successfully");

        // Seed payment types (idempotent — upsert to avoid duplicates)
        for (const type of paymentTypes) {
            await PaymentType.updateOne(
                { name: type.name },
                { $setOnInsert: type },
                { upsert: true }
            );
        }
        console.log("✅ Payment types seeded successfully");

        process.exit(0); // success
    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
        process.exit(1); // failure
    }
};

seedDatabase();