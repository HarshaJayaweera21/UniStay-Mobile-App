require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const User = require("./src/models/User");
const Role = require("./src/models/Role");

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");
        const users = await User.find({}).populate('role');
        if (users.length === 0) {
            console.log("No users found in DB");
        } else {
            console.log(`Found ${users.length} users:`);
            users.forEach(u => {
                console.log(`- ID: ${u._id}`);
                console.log(`  Name: ${u.firstName} ${u.lastName}`);
                console.log(`  Email: ${u.email}`);
                console.log(`  Role: ${u.role ? u.role.name : 'None'}`);
                console.log(`  Registration Number: ${u.registrationNumber || 'N/A'}`);
            });
        }
        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
        mongoose.disconnect();
    }
};

checkUsers();
