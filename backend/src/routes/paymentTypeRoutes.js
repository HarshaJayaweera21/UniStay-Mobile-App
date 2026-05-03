const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { getPaymentTypes } = require("../controllers/paymentController");

// GET /api/payment-types — Both Students and Managers can view payment types
router.get("/", protect, authorizeRoles("student", "manager"), getPaymentTypes);

module.exports = router;
