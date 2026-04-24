const express = require("express");
const router = express.Router();
const { getMyQR, getQRStatus } = require("../controllers/qrController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Student gets own QR
router.get("/my-qr", protect, authorizeRoles("student"), getMyQR);

// Admin checks QR status of a student
router.get("/status/:userId", protect, authorizeRoles("admin"), getQRStatus);

module.exports = router;