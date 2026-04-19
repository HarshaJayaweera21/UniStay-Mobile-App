const express = require("express");
const router = express.Router();
const {
    uploadLeavePass,
    getAllLeavePasses,
    getMyLeavePasses,
    approveLeavePass,
    rejectLeavePass,
    deleteLeavePass
} = require("../controllers/leavePassController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { upload } = require("../utils/uploadToCloudinary");

// Student uploads leave pass document
router.post("/", protect, authorizeRoles("student"), (req, res, next) => {
    upload.single("document")(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
}, uploadLeavePass);

// Student gets own leave pass requests
router.get("/mine", protect, authorizeRoles("student"), getMyLeavePasses);

// Manager gets all leave pass requests
router.get("/", protect, authorizeRoles("manager"), getAllLeavePasses);

// Manager approves leave pass
router.put("/approve/:id", protect, authorizeRoles("manager"), approveLeavePass);

// Manager rejects leave pass
router.put("/reject/:id", protect, authorizeRoles("manager"), rejectLeavePass);

// Manager deletes expired leave pass
router.delete("/:id", protect, authorizeRoles("manager"), deleteLeavePass);

module.exports = router;