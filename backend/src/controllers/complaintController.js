const Complaint = require("../models/Complaint");
const cloudinary = require("../config/cloudinary");
const logger = require("../utils/logger");

// Helper to upload buffer to cloudinary
const uploadImageToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "Complaint_images" },
            (error, result) => {
                if (error) {
                    logger.error("Cloudinary Upload Error:", error);
                    return reject(error);
                }
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private
const createComplaint = async (req, res) => {
    try {
        let { title, description } = req.body;

        // Validation & Sanitization
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ success: false, message: "Title is required" });
        }
        if (!description || typeof description !== 'string' || description.trim() === '') {
            return res.status(400).json({ success: false, message: "Description is required" });
        }

        title = title.trim();
        description = description.trim();

        if (title.length < 5 || title.length > 100) {
            return res.status(400).json({ success: false, message: "Title must be between 5 and 100 characters" });
        }

        if (description.length < 20 || description.length > 5000) {
            return res.status(400).json({ success: false, message: "Description must be between 20 and 5000 characters" });
        }

        let imageUrl = null;
        if (req.file) {
            // Upload the file buffer to Cloudinary
            const uploadResult = await uploadImageToCloudinary(req.file.buffer);
            imageUrl = uploadResult.secure_url;
        }

        const newComplaint = new Complaint({
            userId: req.user.id || req.user._id,
            title,
            description,
            image: imageUrl,
            status: "pending",
        });

        await newComplaint.save();

        res.status(201).json({ success: true, complaint: newComplaint });
    } catch (error) {
        logger.error("Error creating complaint:", error.message);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get all complaints (Manager View)
// @route   GET /api/complaints
// @access  Private (Manager)
const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find().populate("userId", "firstName lastName email").sort({ createdAt: -1 });
        res.status(200).json({ success: true, complaints });
    } catch (error) {
        console.error("Error fetching complaints:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get complaints for current student
// @route   GET /api/complaints/my
// @access  Private (Student)
const getMyComplaints = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const complaints = await Complaint.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, complaints });
    } catch (error) {
        console.error("Error fetching user complaints:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id).populate("userId", "firstName lastName email");
        if (!complaint) {
            return res.status(404).json({ success: false, message: "Complaint not found" });
        }
        res.status(200).json({ success: true, complaint });
    } catch (error) {
        console.error("Error fetching complaint details:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id
// @access  Private (Manager)
const updateComplaintStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!["pending", "in-progress", "resolved"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!complaint) {
            return res.status(404).json({ success: false, message: "Complaint not found" });
        }

        res.status(200).json({ success: true, complaint });
    } catch (error) {
        console.error("Error updating complaint:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private
const deleteComplaint = async (req, res) => {
    try {
        logger.info(`DELETE request for complaint: ${req.params.id} from user: ${req.user.id || req.user._id}`);
        const complaint = await Complaint.findById(req.params.id);
        
        if (!complaint) {
            logger.warn(`Complaint ${req.params.id} not found`);
            return res.status(404).json({ success: false, message: "Complaint not found" });
        }

        // Check if user is owner or admin
        const currentUserId = (req.user.id || req.user._id).toString();
        const complaintOwnerId = complaint.userId.toString();
        const isOwner = complaintOwnerId === currentUserId;
        const isAdminOrManager = req.user.role === 'admin' || req.user.role === 'manager';

        logger.info(`Authorization Check - isOwner: ${isOwner}, isAdminOrManager: ${isAdminOrManager}`);

        if (!isOwner && !isAdminOrManager) {
            logger.denied(`User ${currentUserId} attempted to delete complaint ${req.params.id}`);
            return res.status(403).json({ success: false, message: "Not authorized to delete this complaint" });
        }

        await Complaint.findByIdAndDelete(req.params.id);
        logger.success(`Complaint ${req.params.id} deleted successfully`);
        
        res.status(200).json({ success: true, message: "Complaint deleted successfully" });
    } catch (error) {
        console.error("Error deleting complaint:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

module.exports = {
    createComplaint,
    getAllComplaints,
    getMyComplaints,
    getComplaintById,
    updateComplaintStatus,
    deleteComplaint
};
