require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const Complaint = require("./src/models/Complaint");

const checkComplaint = async (id) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");
        const complaint = await Complaint.findById(id);
        if (!complaint) {
            console.log("Complaint not found in DB");
        } else {
            console.log("Complaint found:");
            console.log(JSON.stringify(complaint, null, 2));
        }
        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

const id = "69e6665f7923704f7504c462";
checkComplaint(id);
