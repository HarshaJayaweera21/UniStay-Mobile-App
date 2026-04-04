require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const announcementRoutes = require("./src/routes/announcementRoutes"); // ✅ ADDED

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// DB connection
connectDB();

// Test route
app.get("/", (req, res) => {
  res.json({ message: "UniStay API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/announcements", announcementRoutes); // ✅ ADDED

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

// Cloudinary connection test
const cloudinary = require("./src/config/cloudinary");

cloudinary.api
  .ping()
  .then((result) => {
    console.log("✅ Cloudinary connected:", result);
  })
  .catch((error) => {
    console.error("❌ Cloudinary connection failed:", error);
  });