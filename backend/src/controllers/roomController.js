const {
    createRoomService,
    getAllRoomsService,
    getRoomByIdService,
    updateRoomService,
    deleteRoomService,
    addGalleryImagesService,
    deleteGalleryImageService
} = require("../services/roomService");

const createRoom = async (req, res) => {
    try {
        console.log("📦 Create Room - req.body:", req.body);
        console.log("📎 Create Room - req.file:", req.file ? req.file.originalname : "No file");
        const result = await createRoomService(req.body, req.file);
        res.status(201).json(result);
    } catch (error) {
        console.error("❌ Create Room Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getAllRooms = async (req, res) => {
    try {
        const { gender } = req.query;
        const result = await getAllRoomsService({ gender });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getRoomById = async (req, res) => {
    try {
        const result = await getRoomByIdService(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

const updateRoom = async (req, res) => {
    try {
        const result = await updateRoomService(req.params.id, req.body, req.file);
        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Update Room Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteRoom = async (req, res) => {
    try {
        const result = await deleteRoomService(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const addGalleryImages = async (req, res) => {
    try {
        const result = await addGalleryImagesService(req.params.id, req.files);
        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Add Gallery Images Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteGalleryImage = async (req, res) => {
    try {
        const result = await deleteGalleryImageService(req.params.id, req.body.imageUrl);
        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Delete Gallery Image Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    createRoom,
    getAllRooms,
    getRoomById,
    updateRoom,
    deleteRoom,
    addGalleryImages,
    deleteGalleryImage
};
