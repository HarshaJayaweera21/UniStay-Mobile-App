const {
    createLeavePassService,
    getAllLeavePassesService,
    getMyLeavePassesService,
    approveLeavePassService,
    rejectLeavePassService,
    deleteLeavePassService
} = require("../services/leavePassService");

// Student uploads leave pass
const uploadLeavePass = async (req, res) => {
    try {
        const data = {
            ...req.body,
            studentId: req.user.id
        };

        const result = await createLeavePassService(data, req.file);

        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Manager gets all leave pass requests
const getAllLeavePasses = async (req, res) => {
    try {
        const result = await getAllLeavePassesService();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Student gets own leave pass requests
const getMyLeavePasses = async (req, res) => {
    try {
        const result = await getMyLeavePassesService(req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Manager approves leave pass
const approveLeavePass = async (req, res) => {
    try {
        const result = await approveLeavePassService(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Manager rejects leave pass
const rejectLeavePass = async (req, res) => {
    try {
        const result = await rejectLeavePassService(req.params.id, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
// Manager deletes leave pass
const deleteLeavePass = async (req, res) => {
    try {
        const result = await deleteLeavePassService(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    uploadLeavePass,
    getAllLeavePasses,
    getMyLeavePasses,
    approveLeavePass,
    rejectLeavePass,
    deleteLeavePass
};