const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    createComplaint,
    getAllComplaints,
    getMyComplaints,
    getComplaintById,
    updateComplaintStatus,
    deleteComplaint
} = require("../controllers/complaintController");

// Apply standard 'protect' middleware to all routes as requested
router.use(protect);

// Create a new complaint (with image upload)
router.post("/", upload.single("image"), createComplaint);

// Get all complaints for manager - Only manager role allowed
router.get("/", authorizeRoles("manager", "admin"), getAllComplaints);

// Get complaints specifically for logged-in user
router.get("/my", getMyComplaints);

// Get specific complaint by ID
router.get("/:id", getComplaintById);

// Update status of specific complaint - Only manager role allowed
router.put("/:id", authorizeRoles("manager", "admin"), updateComplaintStatus);

// Delete complaint
router.delete("/:id", deleteComplaint);

module.exports = router;
