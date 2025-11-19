const { Booking, Doctor, Patient, Specialty } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// GET - Dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Lịch khám hôm nay
        const todayBookings = await Booking.count({
            where: {
                appointment_date: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            }
        });

        // Lịch hoàn thành hôm nay
        const todayCompleted = await Booking.count({
            where: {
                appointment_date: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                },
                status: 'completed'
            }
        });

        // Lịch chờ xác nhận
        const pendingBookings = await Booking.count({
            where: {
                status: 'pending'
            }
        });

        // Lịch đã xác nhận
        const confirmedBookings = await Booking.count({
            where: {
                status: 'confirmed'
            }
        });

        // Tổng số lịch khám
        const totalBookings = await Booking.count();

        // Tổng số bệnh nhân
        const totalPatients = await Patient.count();

        // Tổng số bác sĩ
        const totalDoctors = await Doctor.count();

        // Bác sĩ đang hoạt động
        const activeDoctors = await Doctor.count({
            where: {
                is_active: true
            }
        });

        // Tổng số chuyên khoa
        const totalSpecialties = await Specialty.count();

        // Lịch khám theo trạng thái
        const bookingsByStatus = await Booking.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status']
        });

        const statusCounts = {};
        bookingsByStatus.forEach(item => {
            statusCounts[item.status] = parseInt(item.dataValues.count);
        });

        // Lịch khám 7 ngày tới
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const upcomingBookings = await Booking.count({
            where: {
                appointment_date: {
                    [Op.gte]: today,
                    [Op.lt]: nextWeek
                },
                status: {
                    [Op.in]: ['pending', 'confirmed']
                }
            }
        });

        console.log('✅ Dashboard stats fetched successfully');

        res.json({
            todayBookings,
            todayCompleted,
            pendingBookings,
            confirmedBookings,
            totalBookings,
            totalPatients,
            totalDoctors,
            activeDoctors,
            totalSpecialties,
            upcomingBookings,
            statusCounts
        });

    } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy thống kê',
            error: error.message
        });
    }
};

module.exports = exports;
