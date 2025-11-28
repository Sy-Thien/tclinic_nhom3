const { TimeSlot, Booking, Doctor, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET - Lấy danh sách khung giờ khả dụng cho ngày cụ thể
exports.getAvailableTimeSlots = async (req, res) => {
    try {
        const { date, doctor_id } = req.query;
        console.log('📋 GET /api/public/available-time-slots', { date, doctor_id });

        if (!date) {
            return res.status(400).json({
                message: 'Vui lòng chọn ngày'
            });
        }

        // Lấy tất cả khung giờ đang hoạt động
        const timeSlots = await TimeSlot.findAll({
            where: { is_active: true },
            order: [['start_time', 'ASC']]
        });

        // Đếm số booking cho mỗi khung giờ trong ngày đã chọn
        const bookingCounts = await Booking.count({
            where: {
                appointment_date: date,
                doctor_id: doctor_id || { [Op.ne]: null },
                status: {
                    [Op.in]: ['pending', 'confirmed']
                }
            },
            group: ['appointment_time'],
            raw: true
        });

        // Map booking counts
        const bookingMap = {};
        bookingCounts.forEach(item => {
            bookingMap[item.appointment_time] = parseInt(item.count);
        });

        // Tính toán số chỗ còn trống cho mỗi khung giờ
        const availableSlots = timeSlots.map(slot => {
            const bookedCount = bookingMap[slot.start_time] || 0;
            const availableCount = slot.max_bookings - bookedCount;

            return {
                id: slot.id,
                start_time: slot.start_time,
                end_time: slot.end_time,
                max_bookings: slot.max_bookings,
                booked_count: bookedCount,
                available_count: availableCount,
                is_available: availableCount > 0
            };
        });

        console.log(`✅ Found ${availableSlots.length} time slots`);
        res.json(availableSlots);
    } catch (error) {
        console.error('❌ Error fetching available time slots:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách khung giờ',
            error: error.message
        });
    }
};

// GET - Lấy lịch khám theo ngày (cho calendar view)
exports.getBookingCalendar = async (req, res) => {
    try {
        const { start_date, end_date, doctor_id } = req.query;
        console.log('📅 GET /api/public/booking-calendar', { start_date, end_date, doctor_id });

        const whereClause = {
            status: {
                [Op.in]: ['pending', 'confirmed']
            }
        };

        if (start_date && end_date) {
            whereClause.appointment_date = {
                [Op.between]: [start_date, end_date]
            };
        }

        if (doctor_id) {
            whereClause.doctor_id = doctor_id;
        }

        const bookings = await Booking.findAll({
            where: whereClause,
            attributes: [
                'appointment_date',
                'appointment_time',
                [sequelize.fn('COUNT', sequelize.col('id')), 'booking_count']
            ],
            group: ['appointment_date', 'appointment_time'],
            order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']],
            raw: true
        });

        // Group by date
        const calendar = {};
        bookings.forEach(booking => {
            const date = booking.appointment_date;
            if (!calendar[date]) {
                calendar[date] = [];
            }
            calendar[date].push({
                time: booking.appointment_time,
                count: parseInt(booking.booking_count)
            });
        });

        res.json(calendar);
    } catch (error) {
        console.error('❌ Error fetching booking calendar:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy lịch khám',
            error: error.message
        });
    }
};
