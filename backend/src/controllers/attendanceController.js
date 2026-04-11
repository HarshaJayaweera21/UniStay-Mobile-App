const {
    scanQRService,
    getAllLogsService,
    getStudentLogsService,
    getMyLogsService
} = require("../services/attendanceService");

// Guard scans QR
const scanQR = async (req, res) => {
    try {
        const data = {
            ...req.body,
            guardId: req.user.id
        };

        const result = await scanQRService(data);

        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get all attendance logs — Admin / Manager
const getAllLogs = async (req, res) => {
    try {
        const result = await getAllLogsService();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get logs for a specific student — Admin / Manager
const getStudentLogs = async (req, res) => {
    try {
        const result = await getStudentLogsService(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get own logs — Student
const getMyLogs = async (req, res) => {
    try {
        const result = await getMyLogsService(req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { scanQR, getAllLogs, getStudentLogs, getMyLogs };