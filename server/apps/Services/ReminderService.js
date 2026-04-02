const { Booking, Patient, Doctor, Specialty } = require('../Database/Entity');
const { Op } = require('sequelize');
const emailService = require('./EmailService');

// Kiểm tra và gửi nhắc lịch cho các lịch hẹn sắp tới

class ReminderService {
    async checkAndSendReminders() {
        try {
            console.log('🔔 Checking appointments for reminders...');

            const now = new Date();

            // Tính thời điểm 24 giờ sau
            const reminderTime = new Date(now);
            reminderTime.setHours(now.getHours() + 24);

            // Format ngày để query
            const reminderDate = reminderTime.toISOString().split('T')[0];
            const currentHour = reminderTime.getHours();

            // Lấy các lịch hẹn trong 24h tới chưa được nhắc
            const upcomingAppointments = await Booking.findAll({
                where: {
                    appointment_date: reminderDate,
                    status: {
                        [Op.in]: ['confirmed', 'waiting_doctor_confirmation']
                    },
                    reminder_sent: {
                        [Op.or]: [false, null]
                    },
                    patient_email: {
                        [Op.ne]: null // Phải có email
                    }
                },
                include: [
                    {
                        model: Patient,
                        as: 'patient',
                        attributes: ['id', 'full_name', 'email', 'phone'],
                        required: false // Optional - hỗ trợ guest bookings
                    },
                    {
                        model: Doctor,
                        as: 'doctor',
                        attributes: ['id', 'full_name'],
                        required: false
                    },
                    {
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name'],
                        required: false
                    }
                ]
            });

            console.log(`📧 Found ${upcomingAppointments.length} appointments to remind`);

            let successCount = 0;
            let failCount = 0;

            for (const booking of upcomingAppointments) {
                try {
                    // Chuẩn bị dữ liệu email
                    const appointmentData = {
                        booking_code: booking.booking_code,
                        patient_name: booking.patient_name || booking.patient?.full_name,
                        patient_email: booking.patient?.email || booking.patient_email,
                        appointment_date: booking.appointment_date,
                        appointment_time: booking.appointment_time || 'Chưa xác định',
                        doctor_name: booking.doctor?.full_name || 'Đang chờ phân công',
                        specialty_name: booking.specialty?.name || 'Khám tổng quát'
                    };

                    // Gửi email nhắc lịch
                    const result = await emailService.sendAppointmentReminder(appointmentData);

                    if (result.success) {
                        // Đánh dấu đã gửi nhắc lịch
                        await booking.update({
                            reminder_sent: true,
                            reminder_sent_at: now
                        });
                        successCount++;
                        console.log(`✅ Reminder sent for booking: ${booking.booking_code}`);
                    } else {
                        failCount++;
                        console.log(`❌ Failed to send reminder for: ${booking.booking_code}`);
                    }

                } catch (error) {
                    failCount++;
                    console.error(`❌ Error sending reminder for ${booking.booking_code}:`, error.message);
                }
            }

            console.log(`✅ Reminder summary: ${successCount} sent, ${failCount} failed`);

            return {
                total: upcomingAppointments.length,
                success: successCount,
                failed: failCount
            };

        } catch (error) {
            console.error('❌ Reminder service error:', error);
            throw error;
        }
    };

    // Gửi nhắc lịch cho 1 booking cụ thể (manual trigger)
    async sendManualReminder(bookingId) {
        try {
            const booking = await Booking.findByPk(bookingId, {
                include: [
                    {
                        model: Patient,
                        as: 'patient',
                        attributes: ['id', 'full_name', 'email', 'phone']
                    },
                    {
                        model: Doctor,
                        as: 'doctor',
                        attributes: ['id', 'full_name'],
                        required: false
                    },
                    {
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name'],
                        required: false
                    }
                ]
            });

            if (!booking) {
                throw new Error('Booking not found');
            }

            if (!booking.patient?.email) {
                throw new Error('Patient email not found');
            }

            const appointmentData = {
                booking_code: booking.booking_code,
                patient_name: booking.patient.full_name,
                patient_email: booking.patient.email,
                appointment_date: booking.appointment_date,
                appointment_time: booking.appointment_time,
                doctor_name: booking.doctor?.full_name || 'Đang chờ phân công',
                specialty_name: booking.specialty?.name || 'Khám tổng quát'
            };

            const result = await emailService.sendAppointmentReminder(appointmentData);

            if (result.success) {
                await booking.update({
                    reminder_sent: true,
                    reminder_sent_at: new Date()
                });
            }

            return result;

        } catch (error) {
            console.error('❌ Manual reminder error:', error);
            throw error;
        }
    };

    // Khởi động scheduler (chạy mỗi giờ)
    startScheduler() {
        console.log('🚀 Starting appointment reminder scheduler...');

        // Chạy ngay lần đầu
        this.checkAndSendReminders();

        // Sau đó chạy mỗi 1 giờ
        setInterval(() => {
            this.checkAndSendReminders();
        }, 60 * 60 * 1000); // 1 hour

        console.log('✅ Scheduler started - checking every hour');
    }

}

module.exports = new ReminderService();

