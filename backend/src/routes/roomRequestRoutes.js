const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const upload = require("../middleware/upload");
const {
  createRoomRequest,
  getRoomRequests,
  getAvailableRooms,
  updateRoomRequest,
  deleteRoomRequest,
} = require("../controllers/roomRequestController");

const router = express.Router();

router.get("/rooms/available", authenticate, authorizeRole("student", "manager", "admin"), getAvailableRooms);

router
  .route("/")
  .post(authenticate, authorizeRole("student"), upload.single("paymentProof"), createRoomRequest)
  .get(authenticate, getRoomRequests);

router
  .route("/:id")
  .put(authenticate, upload.single("paymentProof"), updateRoomRequest)
  .delete(authenticate, deleteRoomRequest);

module.exports = router;
