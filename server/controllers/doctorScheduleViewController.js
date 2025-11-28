const { Booking, Patient, Service, Specialty, TimeSlot } = require('../models');
const { Op } = require('sequelize');

// GET - Lấy lịch khám của bác sĩ theo ngày
exports.getDoctorSchedule = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const { date, status } = req.query;
        console.log('📅 GET /api/doctor/my-schedule', { doctor_id, date, status });

        const whereClause = {
            doctor_id
        };

        if (date) {
            whereClause.appointment_date = date;
        } else {
            // Nếu không có date, lấy lịch từ hôm nay trở đi
            whereClause.appointment_date = {
                [Op.gte]: new Date().toISOString().split('T')[0]
            };
        }

        if (status) {
            whereClause.status = status;
        }

        const bookings = await Booking.findAll({
            where: whereClause,
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'phone', 'email', 'gender']
                },
                {
                    model: Service,
                    as: 'service',
                    attributes: ['id', 'name', 'price']
                },
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']]
        });

        // Group by time slot
        const scheduleByTime = {};
        bookings.forEach(booking => {
            const timeKey = booking.appointment_time;
            if (!scheduleByTime[timeKey]) {
                scheduleByTime[timeKey] = [];
            }
            scheduleByTime[timeKey].push(booking);
        });

        console.log(`✅ Found ${bookings.length} appointments`);
        res.json({
            total: bookings.length,
            bookings,
            scheduleByTime
        });
    } catch (error) {
        console.error('❌ Error fetching doctor schedule:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy lịch khám',
            error: error.message
        });
    }
};

// GET - Lấy thống kê lịch khám theo tuần/tháng
exports.getDoctorScheduleStatistics = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const { start_date, end_date } = req.query;
        console.log('📊 GET /api/doctor/schedule-statistics', { doctor_id, start_date, end_date });

        const whereClause = {
            doctor_id,
            status: {
                [Op.in]: ['pending', 'confirmed', 'completed']
            }
        };

        if (start_date && end_date) {
            whereClause.appointment_date = {
                [Op.between]: [start_date, end_date]
            };
        }

        const bookings = await Booking.findAll({
            where: whereClause,
            attributes: ['appointment_date', 'appointment_time', 'status'],
            order: [['appointment_date', 'ASC']]
        });

        // Thống kê theo ngày
        const dailyStats = {};
        bookings.forEach(booking => {
            const date = booking.appointment_date;
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    total: 0,
                    pending: 0,
                    confirmed: 0,
                    completed: 0
                };
            }
            dailyStats[date].total++;
            dailyStats[date][booking.status]++;
        });

        res.json({
            total: bookings.length,
            dailyStats
        });
    } catch (error) {
        console.error('❌ Error fetching schedule statistics:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy thống kê',
            error: error.message
        });
    }
};
