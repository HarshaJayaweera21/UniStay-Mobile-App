const express = require("express");
const router = express.Router();
const {
    verifyScan,
    scanQR,
    getAllLogs,
    getStudentLogs,
    getMyLogs,
    getTodayScanCount
} = require("../controllers/attendanceController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Get today's scan count — Guard
router.get("/scan-count", protect, authorizeRoles("guard"), getTodayScanCount);

// Guard verifies QR (check rules, don't save)
router.post("/verify-scan", protect, authorizeRoles("guard"), verifyScan);

// Guard scans QR — entry or exit
router.post("/scan", protect, authorizeRoles("guard"), scanQR);

// Get all attendance logs — Admin and Manager
router.get("/", protect, authorizeRoles("admin", "manager"), getAllLogs);

// Get own attendance logs — Student
router.get("/mine", protect, authorizeRoles("student"), getMyLogs);

// Get logs for a specific student — Admin and Manager
router.get("/student/:id", protect, authorizeRoles("admin", "manager"), getStudentLogs);

module.exports = router;