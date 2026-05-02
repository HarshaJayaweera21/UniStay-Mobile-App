const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { upload, handleUploadError } = require("../middleware/agreementUpload");
const {
    createRoomRequest,
    getMyRequest,
    getAllRequests,
    getRequestById,
    updateRequestStatus,
    uploadAgreement,
    uploadReceipt,
    verifyReceipt
} = require("../controllers/roomRequestController");

// POST /api/room-requests (Student)
router.post("/", protect, authorizeRoles("student"), createRoomRequest);

// GET /api/room-requests/my-request (Student)
router.get("/my-request", protect, authorizeRoles("student"), getMyRequest);

// GET /api/room-requests (Manager)
router.get("/", protect, authorizeRoles("manager"), getAllRequests);

// GET /api/room-requests/:id (Manager)
router.get("/:id", protect, authorizeRoles("manager"), getRequestById);

// PUT /api/room-requests/:id/status (Manager: Reject)
router.put("/:id/status", protect, authorizeRoles("manager"), updateRequestStatus);

// POST /api/room-requests/:id/agreement (Manager: Upload agreement PDF)
router.post(
    "/:id/agreement",
    protect,
    authorizeRoles("manager"),
    upload.single("file"),
    handleUploadError,
    uploadAgreement
);

// POST /api/room-requests/:id/receipt (Student: Upload signed agreement & receipt PDF)
router.post(
    "/:id/receipt",
    protect,
    authorizeRoles("student"),
    upload.single("file"),
    handleUploadError,
    uploadReceipt
);

// PUT /api/room-requests/:id/verify (Manager: Verify receipt & confirm room)
router.put("/:id/verify", protect, authorizeRoles("manager"), verifyReceipt);

module.exports = router;
