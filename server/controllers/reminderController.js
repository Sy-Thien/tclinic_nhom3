const reminderService = require('../services/reminderService');

// Test gửi nhắc lịch thủ công (cho 1 booking)
exports.sendTestReminder = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const result = await reminderService.sendManualReminder(bookingId);

        if (result.success) {
            res.json({
                success: true,
                message: 'Đã gửi email nhắc lịch thành công',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Gửi email thất bại',
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Test reminder error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Chạy kiểm tra và gửi tất cả nhắc lịch (manual trigger)
exports.checkAndSendAll = async (req, res) => {
    try {
        const result = await reminderService.checkAndSendReminders();

        res.json({
            success: true,
            message: 'Đã kiểm tra và gửi nhắc lịch',
            result: {
                total: result.total,
                success: result.success,
                failed: result.failed
            }
        });

    } catch (error) {
        console.error('❌ Check reminders error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy thống kê nhắc lịch
exports.getReminderStats = async (req, res) => {
    try {
        const { Booking } = require('../models');
        const { Op } = require('sequelize');

        const today = new Date().toISOString().split('T')[0];

        const stats = {
            totalReminders: await Booking.count({
                where: { reminder_sent: true }
            }),
            todayReminders: await Booking.count({
                where: {
                    reminder_sent: true,
                    reminder_sent_at: {
                        [Op.gte]: new Date(today)
                    }
                }
            }),
            pendingReminders: await Booking.count({
                where: {
                    reminder_sent: false,
                    appointment_date: {
                        [Op.gte]: today
                    },
                    status: {
                        [Op.in]: ['confirmed', 'waiting_doctor_confirmation']
                    }
                }
            })
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('❌ Get stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = exports;
