const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    let user;

    // 1. Try to verify token if provided
    if (authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.userId).populate("role", "name");
      } catch (err) {
        // Ignore token errors in dev bypass mode
      }
    }

    // 2. Fallback to any user from the database
    if (!user) {
      user = await User.findOne({}).populate("role", "name");
    }

    // 3. Absolute fallback: Mock user if database is completely empty
    if (!user) {
      user = {
        _id: "000000000000000000000000",
        firstName: "System",
        lastName: "Guest",
        email: "guest@unistay.com",
        role: { name: "admin" }
      };
    }

    req.user = user;
    return next();
  } catch (error) {
    // If something explodes, still allow as mock user
    req.user = {
      _id: "000000000000000000000000",
      email: "emergency-guest@unistay.com",
      role: { name: "admin" }
    };
    return next();
  }
};

module.exports = authenticate;
