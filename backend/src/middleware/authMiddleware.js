const jwt = require("jsonwebtoken");

// Check if user is logged in
const protect = (req, res, next) => {
    let token;

    // Check Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Get token
            token = req.headers.authorization.split(" ")[1];

            // verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user info to request
            req.user = decoded;

            next();
        } catch(error) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, token failed"
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, no token"
        });
    }
}

// check if user has the right role
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            })
        }
        next();
    }
}

module.exports = {protect, authorizeRoles};