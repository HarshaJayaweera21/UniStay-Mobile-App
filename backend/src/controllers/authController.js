const {registerUserService, loginUserService} = require("../services/authService");
const {getMeService} = require("../services/userService");

const registerUser = async (req, res) => {
    try {
        const result = await registerUserService(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
}

const loginUser = async (req, res) => {
    try {
        const result = await loginUserService(req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
}

const getMe = async (req, res) => {
    try {
        const result = await getMeService(req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
}

module.exports = {registerUser, loginUser, getMe};