/**
 * Validation Middleware
 */
const { validationResult, body, param, query } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: errors.array()
        });
    }
    next();
};

// Common validation rules
const validationRules = {
    // Auth validations
    login: [
        body('identifier').notEmpty().withMessage('Email/Username là bắt buộc'),
        body('password').notEmpty().withMessage('Mật khẩu là bắt buộc')
    ],

    register: [
        body('email').isEmail().withMessage('Email không hợp lệ'),
        body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
        body('full_name').notEmpty().withMessage('Họ tên là bắt buộc'),
        body('phone').notEmpty().withMessage('Số điện thoại là bắt buộc')
    ],

    // Booking validations
    createBooking: [
        body('specialty_id').notEmpty().withMessage('Chuyên khoa là bắt buộc'),
        body('appointment_date').isDate().withMessage('Ngày hẹn không hợp lệ')
    ],

    // ID param validation
    idParam: [
        param('id').isInt({ min: 1 }).withMessage('ID không hợp lệ')
    ],

    // Pagination query
    pagination: [
        query('page').optional().isInt({ min: 1 }).withMessage('Page phải là số nguyên dương'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100')
    ]
};

module.exports = {
    validate,
    validationRules,
    body,
    param,
    query
};
