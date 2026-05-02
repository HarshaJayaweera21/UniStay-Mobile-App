require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const roomRoutes = require("./src/routes/roomRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const paymentTypeRoutes = require("./src/routes/paymentTypeRoutes");
const roomRequestRoutes = require("./src/routes/roomRequestRoutes");
const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors()); // handles cross origin requests
app.use(express.json({ limit: '10mb' })); // parses request body
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // parses form data

// DB connection
connectDB();

app.get("/", (req, res) => {
  // res.send("<h1>Hello World</h1>");
  res.json({ message: "UniStay API is running" });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payment-types", paymentTypeRoutes);
app.use("/api/room-requests", roomRequestRoutes);
// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler:", err);
  if (err.name === "MulterError") {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(err.status || 400).json({ success: false, message: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

// cloudinary connection test
const cloudinary = require("./src/config/cloudinary");

cloudinary.api
  .ping()
  .then((result) => {
    console.log("✅ Cloudinary connected:", result);
  })
  .catch((error) => {
    console.error("❌ Cloudinary connection failed:", error);
});
