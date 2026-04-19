const Payment = require("../models/Payment");
const PaymentType = require("../models/PaymentType");
const https = require("https");
const http = require("http");
const cloudinary = require("../config/cloudinary");

/**
 * Create a new payment (Student only)
 * POST /api/payments
 * Requires: upload middleware to run first (receipt file → req.file)
 */
const createPayment = async (req, res) => {
    try {
        const { paymentType, amount } = req.body;

        // Validate required fields
        if (!paymentType || !amount) {
            return res.status(400).json({
                success: false,
                message: "Payment type and amount are required.",
            });
        }

        // Validate amount is a positive number
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be a number greater than 0.",
            });
        }

        // Validate that the payment type exists
        const typeExists = await PaymentType.findById(paymentType);
        if (!typeExists) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment type.",
            });
        }

        // Ensure receipt file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Receipt file is required. Please upload a JPG, PNG, or PDF file.",
            });
        }

        // Create the payment — studentId from JWT, status forced to Pending
        const payment = await Payment.create({
            studentId: req.user.id,
            paymentType,
            amount: parsedAmount,
            receipt: req.file.path,
            cloudinaryId: req.file.filename,
            status: "Pending",
        });

        res.status(201).json({
            success: true,
            message: "Payment submitted successfully.",
            payment,
        });
    } catch (error) {
        console.error("createPayment error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while creating payment.",
        });
    }
};

/**
 * Get payments (role-based filtering)
 * GET /api/payments
 * Student → own payments only | Manager → all payments
 */
const getPayments = async (req, res) => {
    try {
        let filter = {};

        // Students can only see their own payments
        if (req.user.role === "student") {
            filter.studentId = req.user.id;
        }
        // Managers see all payments (no filter)

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const startIndex = (page - 1) * limit;

        const payments = await Payment.find(filter)
            .populate("studentId", "firstName lastName email username")
            .populate("paymentType", "name")
            .populate("reviewedBy", "firstName lastName")
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        const total = await Payment.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: payments.length,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            payments,
        });
    } catch (error) {
        console.error("getPayments error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching payments.",
        });
    }
};

/**
 * Get single payment by ID (Manager or owning Student)
 * GET /api/payments/:id
 */
const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate("studentId", "firstName lastName email username")
            .populate("paymentType", "name")
            .populate("reviewedBy", "firstName lastName");

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found.",
            });
        }

        // Students can only view their own payments
        if (req.user.role === "student" && payment.studentId._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only view your own payments.",
            });
        }

        res.status(200).json({
            success: true,
            payment,
        });
    } catch (error) {
        console.error("getPaymentById error:", error);

        // Handle invalid ObjectId format
        if (error.kind === "ObjectId") {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID format.",
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error while fetching payment.",
        });
    }
};

/**
 * Update payment status — Approve or Reject (Manager only)
 * PUT /api/payments/:id
 * Body: { status: "Approved" | "Rejected", note?: string }
 */
const updatePaymentStatus = async (req, res) => {
    try {
        const { status, note } = req.body;

        // Validate status value
        const allowedStatuses = ["Approved", "Rejected"];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid status. Status must be either "Approved" or "Rejected".',
            });
        }

        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found.",
            });
        }

        // Prevent re-processing of already processed payments
        if (payment.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `This payment has already been ${payment.status.toLowerCase()}. Only pending payments can be updated.`,
            });
        }

        // Update the payment
        payment.status = status;
        payment.reviewedBy = req.user.id;
        payment.reviewedAt = new Date();
        if (note) {
            payment.note = note;
        }

        await payment.save();

        // Return the populated payment
        const updatedPayment = await Payment.findById(payment._id)
            .populate("studentId", "firstName lastName email username")
            .populate("paymentType", "name")
            .populate("reviewedBy", "firstName lastName");

        res.status(200).json({
            success: true,
            message: `Payment ${status.toLowerCase()} successfully.`,
            payment: updatedPayment,
        });
    } catch (error) {
        console.error("updatePaymentStatus error:", error);

        if (error.kind === "ObjectId") {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID format.",
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error while updating payment status.",
        });
    }
};

/**
 * Get all payment types
 * GET /api/payment-types
 */
const getPaymentTypes = async (req, res) => {
    try {
        const paymentTypes = await PaymentType.find().sort({ name: 1 });

        res.status(200).json({
            success: true,
            paymentTypes,
        });
    } catch (error) {
        console.error("getPaymentTypes error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching payment types.",
        });
    }
};

/**
 * Proxy endpoint to stream a payment receipt from Cloudinary
 * GET /api/payments/:id/receipt
 * Fetches the file from the stored Cloudinary URL and pipes it to the response
 */
const getPaymentReceipt = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found." });
        }

        if (!payment.receipt) {
            return res.status(404).json({ success: false, message: "No receipt found for this payment." });
        }

        // Students can only access their own receipts
        if (req.user.role === "student" && payment.studentId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const receiptUrl = payment.receipt;
        const protocol = receiptUrl.startsWith("https") ? https : http;

        protocol.get(receiptUrl, (fileResponse) => {
            // Handle Cloudinary redirects
            if (fileResponse.statusCode >= 300 && fileResponse.statusCode < 400 && fileResponse.headers.location) {
                const redirectProtocol = fileResponse.headers.location.startsWith("https") ? https : http;
                redirectProtocol.get(fileResponse.headers.location, (redirectedResponse) => {
                    res.setHeader("Content-Type", redirectedResponse.headers["content-type"] || "application/pdf");
                    if (redirectedResponse.headers["content-length"]) {
                        res.setHeader("Content-Length", redirectedResponse.headers["content-length"]);
                    }
                    redirectedResponse.pipe(res);
                }).on("error", (err) => {
                    console.error("Redirect stream error:", err);
                    res.status(500).json({ success: false, message: "Failed to stream receipt." });
                });
                return;
            }

            if (fileResponse.statusCode !== 200) {
                return res.status(502).json({ success: false, message: "Failed to fetch receipt from storage." });
            }

            res.setHeader("Content-Type", fileResponse.headers["content-type"] || "application/pdf");
            if (fileResponse.headers["content-length"]) {
                res.setHeader("Content-Length", fileResponse.headers["content-length"]);
            }
            fileResponse.pipe(res);
        }).on("error", (err) => {
            console.error("getPaymentReceipt stream error:", err);
            res.status(500).json({ success: false, message: "Failed to stream receipt." });
        });
    } catch (error) {
        console.error("getPaymentReceipt error:", error);
        if (error.kind === "ObjectId") {
            return res.status(400).json({ success: false, message: "Invalid payment ID format." });
        }
        res.status(500).json({ success: false, message: "Server error while fetching receipt." });
    }
};

/**
 * Resubmit / Edit a payment (Student only)
 * PUT /api/payments/:id/resubmit
 * Allows students to update pending or rejected payments
 * Body (multipart/form-data): { paymentType?, amount?, receipt? (file) }
 */
const resubmitPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found.",
            });
        }

        // Verify ownership
        if (payment.studentId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only edit your own payments.",
            });
        }

        // Only allow editing Pending or Rejected payments
        if (payment.status === "Approved") {
            return res.status(400).json({
                success: false,
                message: "Approved payments cannot be edited.",
            });
        }

        // Update fields if provided
        const { paymentType, amount } = req.body;

        if (paymentType) {
            const typeExists = await PaymentType.findById(paymentType);
            if (!typeExists) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid payment type.",
                });
            }
            payment.paymentType = paymentType;
        }

        if (amount) {
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Amount must be a number greater than 0.",
                });
            }
            payment.amount = parsedAmount;
        }

        // Update receipt if a new file was uploaded
        if (req.file) {
            // Delete old file from Cloudinary if it exists
            if (payment.cloudinaryId) {
                try {
                    await cloudinary.uploader.destroy(payment.cloudinaryId);
                } catch (error) {
                    console.error("Cloudinary delete old receipt error:", error);
                    // Continue even if Cloudinary delete fails
                }
            }
            
            payment.receipt = req.file.path;
            payment.cloudinaryId = req.file.filename;
        }

        // Reset status back to Pending for re-review
        payment.status = "Pending";
        // Clear any previous rejection note and audit logs
        payment.note = undefined;
        payment.reviewedBy = undefined;
        payment.reviewedAt = undefined;

        await payment.save();

        const updatedPayment = await Payment.findById(payment._id)
            .populate("studentId", "firstName lastName email username")
            .populate("paymentType", "name")
            .populate("reviewedBy", "firstName lastName");

        res.status(200).json({
            success: true,
            message: "Payment resubmitted successfully.",
            payment: updatedPayment,
        });
    } catch (error) {
        console.error("resubmitPayment error:", error);
        if (error.kind === "ObjectId") {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID format.",
            });
        }
        res.status(500).json({
            success: false,
            message: "Server error while resubmitting payment.",
        });
    }
};

/**
 * Delete a payment (Student only)
 * DELETE /api/payments/:id
 * Only allowed if status is Pending
 */
const deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found.",
            });
        }

        // Verify ownership
        if (payment.studentId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only delete your own payments.",
            });
        }

        // Only allow deleting Pending payments
        if (payment.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `You cannot delete a ${payment.status} payment.`,
            });
        }

        // Delete from Cloudinary first
        if (payment.cloudinaryId) {
            try {
                await cloudinary.uploader.destroy(payment.cloudinaryId);
            } catch (error) {
                console.error("Cloudinary delete receipt error:", error);
                // We'll still proceed to delete the record so they aren't stuck
            }
        }

        // Remove from database
        await payment.deleteOne();

        res.status(200).json({
            success: true,
            message: "Payment canceled successfully.",
            id: req.params.id
        });
    } catch (error) {
        console.error("deletePayment error:", error);
        
        if (error.kind === "ObjectId") {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID format.",
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Server error while deleting payment.",
        });
    }
};

module.exports = {
    createPayment,
    getPayments,
    getPaymentById,
    updatePaymentStatus,
    getPaymentTypes,
    getPaymentReceipt,
    resubmitPayment,
    deletePayment,
};
