const express = require("express");
const { getMe, updateProfile, changePassword } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");

const router = express.Router();

// All user routes require authentication
router.use(protect);

router.get("/me", getMe);
router.put("/profile", uploadMiddleware.single("profilePicture"), updateProfile);
router.patch("/change-password", changePassword);

module.exports = router;
