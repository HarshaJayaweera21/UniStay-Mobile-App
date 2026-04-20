const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Auth bypass: Always allow access in dev as per user request
    return next();
  };
};

module.exports = authorizeRole;
