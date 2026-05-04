const Room = require("../models/Room");
const cloudinary = require("../config/cloudinary");


const streamUpload = (fileBuffer, options) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (result) {
                resolve(result);
            } else {
                reject(error);
            }
        });
        stream.end(fileBuffer);
    });
};

// Create a new room
const createRoomService = async (data, file) => {
    const { roomNumber, roomType, pricePerMonth, capacity, description, gender } = data;

    // Validate required fields
    if (!roomNumber || !roomType || !pricePerMonth || !capacity || !gender) {
        throw new Error("Room number, type, price, capacity, and gender are required");
    }

    // Validate gender
    if (!["male", "female"].includes(gender)) {
        throw new Error("Gender must be male or female");
    }


    // Validate roomType
    const allowedTypes = ["Single", "Double", "Triple"];
    if (!allowedTypes.includes(roomType)) {
        throw new Error("Room type must be Single, Double, or Triple");
    }

    // Validate price
    if (pricePerMonth <= 0) {
        throw new Error("Price per month must be greater than 0");
    }

    // Validate capacity
    if (capacity <= 0) {
        throw new Error("Capacity must be greater than 0");
    }

    // Check if room number already exists
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
        throw new Error("Room number already exists");
    }



    // Upload image to Cloudinary if provided
    let imageUrl = "";
    if (file) {
        const result = await streamUpload(file.buffer, {
            folder: "Room_Images",
            transformation: [{ width: 800, height: 600, crop: "limit" }]
        });
        imageUrl = result.secure_url;
    }

    const newRoom = new Room({
        roomNumber,
        roomType,
        pricePerMonth: Number(pricePerMonth),
        capacity: Number(capacity),
        currentOccupancy: 0,
        description: description || "",
        image: imageUrl,
        gender: gender
    });

    await newRoom.save();

    return {
        success: true,
        message: "Room created successfully",
        room: newRoom
    };
};

// Get all rooms
const getAllRoomsService = async (filters = {}) => {
    const query = {};
    if (filters.gender) {
        query.gender = filters.gender;
    }
    
    const rooms = await Room.find(query).sort({ createdAt: -1 });

    return {
        success: true,
        count: rooms.length,
        rooms
    };
};

// Get a single room by ID
const getRoomByIdService = async (id) => {
    const room = await Room.findById(id);

    if (!room) {
        throw new Error("Room not found");
    }

    return {
        success: true,
        room
    };
};

// Update a room
const updateRoomService = async (id, data, file) => {
    const room = await Room.findById(id);

    if (!room) {
        throw new Error("Room not found");
    }

    // Check for duplicate room number if it's being changed
    if (data.roomNumber && data.roomNumber !== room.roomNumber) {
        const existingRoom = await Room.findOne({ roomNumber: data.roomNumber });
        if (existingRoom) {
            throw new Error("Room number already exists");
        }
    }

    // Validate roomType if provided
    if (data.roomType) {
        const allowedTypes = ["Single", "Double", "Triple"];
        if (!allowedTypes.includes(data.roomType)) {
            throw new Error("Room type must be Single, Double, or Triple");
        }
    }

    // Validate gender if provided
    if (data.gender && !["male", "female"].includes(data.gender)) {
        throw new Error("Gender must be male or female");
    }

    // Validate price if provided
    if (data.pricePerMonth !== undefined && data.pricePerMonth <= 0) {
        throw new Error("Price per month must be greater than 0");
    }

    // Validate capacity if provided
    if (data.capacity !== undefined && data.capacity <= 0) {
        throw new Error("Capacity must be greater than 0");
    }

    // Upload new image to Cloudinary if provided
    if (file) {
        // Delete old image from Cloudinary if it exists
        if (room.image) {
            try {
                const publicId = room.image.split("/").slice(-2).join("/").split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.error("Failed to delete old image:", err.message);
            }
        }

        const result = await streamUpload(file.buffer, {
            folder: "Room_Images",
            transformation: [{ width: 800, height: 600, crop: "limit" }]
        });
        data.image = result.secure_url;
    }

    // Update fields
    if (data.roomNumber) room.roomNumber = data.roomNumber;
    if (data.roomType) room.roomType = data.roomType;
    if (data.pricePerMonth) room.pricePerMonth = Number(data.pricePerMonth);
    if (data.capacity) room.capacity = Number(data.capacity);
    if (data.description !== undefined) room.description = data.description;
    if (data.image) room.image = data.image;
    if (data.currentOccupancy !== undefined) room.currentOccupancy = Number(data.currentOccupancy);
    if (data.gender) room.gender = data.gender;

    // Save triggers the pre-save hook to recalculate availabilityStatus
    await room.save();

    return {
        success: true,
        message: "Room updated successfully",
        room
    };
};

// Delete a room
const deleteRoomService = async (id) => {
    const room = await Room.findById(id);

    if (!room) {
        throw new Error("Room not found");
    }

    // Prevent deletion if room has occupants
    if (room.currentOccupancy > 0) {
        throw new Error("Cannot delete room with active occupants");
    }

    // Delete image from Cloudinary if it exists
    if (room.image) {
        try {
            const publicId = room.image.split("/").slice(-2).join("/").split(".")[0];
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            console.error("Failed to delete image:", err.message);
        }
    }

    await Room.findByIdAndDelete(id);

    return {
        success: true,
        message: "Room deleted successfully"
    };
};

// Add images to room gallery
const addGalleryImagesService = async (id, files) => {
    const room = await Room.findById(id);
    if (!room) throw new Error("Room not found");
    if (!files || files.length === 0) throw new Error("No images provided");

    const uploadedUrls = [];
    for (const file of files) {
        const result = await streamUpload(file.buffer, {
            folder: "Room_Images",
            transformation: [{ width: 1200, height: 900, crop: "limit" }]
        });
        uploadedUrls.push(result.secure_url);
    }

    room.images = [...(room.images || []), ...uploadedUrls];
    await room.save();

    return {
        success: true,
        message: `${uploadedUrls.length} image(s) added successfully`,
        images: room.images
    };
};

// Delete a single gallery image
const deleteGalleryImageService = async (id, imageUrl) => {
    const room = await Room.findById(id);
    if (!room) throw new Error("Room not found");

    if (!room.images.includes(imageUrl)) {
        throw new Error("Image not found in gallery");
    }

    // Delete from Cloudinary
    try {
        const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error("Failed to delete gallery image from Cloudinary:", err.message);
    }

    room.images = room.images.filter(img => img !== imageUrl);
    await room.save();

    return {
        success: true,
        message: "Gallery image deleted",
        images: room.images
    };
};

module.exports = {
    createRoomService,
    getAllRoomsService,
    getRoomByIdService,
    updateRoomService,
    deleteRoomService,
    addGalleryImagesService,
    deleteGalleryImageService
};
