const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { upload, handleUploadError } = require("../middleware/paymentUpload");
const {
    createPayment,
    getPayments,
    getPaymentById,
    updatePaymentStatus,
} = require("../controllers/paymentController");

// POST /api/payments — Student creates a payment with receipt upload
router.post(
    "/",
    protect,
    authorizeRoles("student"),
    upload.single("receipt"),
    handleUploadError,
    createPayment
);

// GET /api/payments — Student sees own, Manager sees all
router.get("/", protect, authorizeRoles("student", "manager"), getPayments);

// GET /api/payments/:id — Manager views single payment detail
router.get("/:id", protect, authorizeRoles("manager"), getPaymentById);

// PUT /api/payments/:id — Manager approves or rejects a payment
router.put("/:id", protect, authorizeRoles("manager"), updatePaymentStatus);

module.exports = router;
