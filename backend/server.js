require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./src/config/db");
const roomRequestRoutes = require("./src/routes/roomRequestRoutes");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB connection
connectDB();


app.get('/', (req, res) => {
    res.json({message: "UniStay API is running (V2 - AUTH BYPASSED)"});
})

app.use("/requests", roomRequestRoutes);

// --- Temporary login route ---
const jwt = require("jsonwebtoken");
const User = require("./src/models/User");
require("./src/models/Role");
app.post("/auth/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email is required" });
    const user = await User.findOne({ email: email.toLowerCase() }).populate("role", "name");
    if (!user) return res.status(404).json({ message: "User not found" });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
    return res.json({ token, user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, role: user.role?.name } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`)
})




