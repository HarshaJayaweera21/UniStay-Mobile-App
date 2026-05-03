const express = require("express");
const { upload } = require("../middleware/uploadMiddleware");
const { createAnnouncement, getAllAnnouncements, deleteAnnouncement, updateAnnouncement } = require("../controllers/announcementController");

const router = express.Router();

router.post("/create", upload.single("file"), createAnnouncement);
router.get("/", getAllAnnouncements);
router.delete("/:id", deleteAnnouncement);
router.put("/:id", upload.single("file"), updateAnnouncement);

module.exports = router;