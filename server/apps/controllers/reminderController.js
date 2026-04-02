const reminderService = require('../Services/ReminderService');
const emailService = require('../Services/EmailService');

// Test gửi nhắc lịch thủ công (cho 1 booking)

class ReminderController {
    async sendTestReminder(req, res) {
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
    async checkAndSendAll(req, res) {
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
    async getReminderStats(req, res) {
        try {
            const { Booking } = require('../Database/Entity');
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

    // Test kết nối email
    async testEmailConnection(req, res) {
        try {
            const isConnected = await emailService.testConnection();
            res.json({
                success: isConnected,
                message: isConnected ? 'Email server sẵn sàng!' : 'Không thể kết nối email server'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Gửi test email đến địa chỉ bất kỳ
    async sendTestEmail(req, res) {
        try {
            const { to_email } = req.body;

            if (!to_email) {
                return res.status(400).json({ message: 'Vui lòng nhập email nhận' });
            }

            const result = await emailService.sendBookingConfirmation({
                patient_name: 'Test User',
                patient_email: to_email,
                booking_code: 'TEST' + Date.now().toString().slice(-6),
                appointment_date: new Date().toISOString().split('T')[0],
                appointment_time: '10:00',
                specialty_name: 'Test Chuyên Khoa'
            });

            res.json({
                success: true,
                message: `Email đã được gửi đến ${to_email}`,
                result
            });
        } catch (error) {
            console.error('Test email error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

}

module.exports = new ReminderController();



