const mongoose = require("mongoose");
const dns = require("dns");

// Work around local DNS resolvers that reject SRV lookups used by MongoDB Atlas.
const customDnsServers = process.env.CUSTOM_DNS_SERVERS || "8.8.8.8,1.1.1.1";
const dnsServerList = customDnsServers
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

if (dnsServerList.length > 0) {
    dns.setServers(dnsServerList);
}

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log("✅ Connected to MongoDB");
    }
    catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        process.exit(1)
    }
}

module.exports = connectDB;