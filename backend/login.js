/**
 * Quick login script — connects to MongoDB and generates a JWT for a user by email.
 * Uses a retry/delay to handle intermittent DNS issues.
 * Usage: node login.js <email> <password>
 */
require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const email = (process.argv[2] || "").toLowerCase();
const password = process.argv[3] || "";

if (!email || !password) {
  console.error("Usage: node login.js <email> <password>");
  process.exit(1);
}

const tryConnect = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      return;
    } catch (err) {
      console.log(`Connection attempt ${i + 1} failed: ${err.message}`);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 2000));
      else throw err;
    }
  }
};

(async () => {
  try {
    await tryConnect();
    console.log("Connected to MongoDB");
    
    const User = require("./src/models/User");
    require("./src/models/Role");

    const user = await User.findOne({ email })
      .select("+password")
      .populate("role", "name");

    if (!user) {
      console.error("User not found:", email);
      const all = await User.find({}).select("email firstName lastName").populate("role", "name");
      console.log("Existing users:");
      all.forEach((u) => console.log(`  ${u.email} (${u.firstName} ${u.lastName}) [${u.role?.name}]`));
      process.exit(1);
    }

    console.log(`User: ${user.firstName} ${user.lastName} | Role: ${user.role?.name}`);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    console.log("\n=== JWT TOKEN ===");
    console.log(token);
    console.log("=================\n");
    process.exit(0);
  } catch (err) {
    console.error("Fatal:", err.message);
    process.exit(1);
  }
})();
