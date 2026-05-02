const { getMeService, updateProfileService, changePasswordService } = require("../services/userService");

const getMe = async (req, res) => {
    try {
        // req.user is set by the protect middleware
        const result = await getMeService(req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const result = await updateProfileService(req.user.id, req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const result = await changePasswordService(req.user.id, req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = { getMe, updateProfile, changePassword };
