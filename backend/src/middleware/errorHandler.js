const notFound = (req, res, _next) => {
  return res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, _req, res, _next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  return res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
};

module.exports = { notFound, errorHandler };
