const express = require("express");
const { getMe, updateProfile, changePassword } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All user routes require authentication
router.use(protect);

router.get("/me", getMe);
router.put("/profile", updateProfile);
router.patch("/change-password", changePassword);

module.exports = router;
