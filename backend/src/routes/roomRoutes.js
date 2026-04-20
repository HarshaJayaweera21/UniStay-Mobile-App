const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
    createRoom,
    getAllRooms,
    getRoomById,
    updateRoom,
    deleteRoom,
    addGalleryImages,
    deleteGalleryImage
} = require("../controllers/roomController");

const router = express.Router();

// Public routes (any authenticated user can view)
router.get("/", getAllRooms);
router.get("/:id", getRoomById);

// Protected routes (manager only)
router.post("/", protect, authorizeRoles("manager"), upload.single("image"), createRoom);
router.put("/:id", protect, authorizeRoles("manager"), upload.single("image"), updateRoom);
router.delete("/:id", protect, authorizeRoles("manager"), deleteRoom);

// Gallery routes (manager only)
router.post("/:id/images", protect, authorizeRoles("manager"), upload.array("images", 10), addGalleryImages);
router.delete("/:id/images", protect, authorizeRoles("manager"), deleteGalleryImage);

module.exports = router;
