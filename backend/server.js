require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const complaintRoutes = require("./src/routes/complaintRoutes");

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors()); // handles cross origin requests
app.use(express.json()); // parses request body

// DB connection
connectDB();

app.get("/", (req, res) => {
  // res.send("<h1>Hello World</h1>");
  res.json({ message: "UniStay API is running" });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port http://0.0.0.0:${PORT}`);
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
