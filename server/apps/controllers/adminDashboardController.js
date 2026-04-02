const { Booking, Doctor, Patient, Specialty } = require('../Database/Entity');
const { Op } = require('sequelize');
const sequelize = require('../Database/DatabaseConnection');
const moment = require('moment');

// GET - Dashboard statistics

class AdminDashboardController {
        async getDashboardStats(req, res) {
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

    // GET - Tình trạng bác sĩ (đang khám / rảnh)
        async getDoctorStatus(req, res) {
        try {
            const now = moment();
            const today = now.format('YYYY-MM-DD');
            const currentTime = now.format('HH:mm:ss');

            // Lấy tất cả bác sĩ active
            const doctors = await Doctor.findAll({
                where: { is_active: true },
                attributes: ['id', 'full_name', 'phone', 'avatar'],
                include: [{
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }],
                order: [['full_name', 'ASC']]
            });

            // Lấy các booking đang diễn ra (confirmed và trong khoảng thời gian hiện tại)
            const activeBookings = await Booking.findAll({
                where: {
                    appointment_date: today,
                    status: { [Op.in]: ['confirmed', 'in_progress'] }
                },
                attributes: ['doctor_id', 'appointment_time', 'patient_name', 'status'],
                include: [{
                    model: Patient,
                    as: 'patient',
                    attributes: ['full_name']
                }]
            });

            // Map doctor status
            const doctorStatusList = doctors.map(doctor => {
                // Tìm booking hiện tại của bác sĩ
                const currentBooking = activeBookings.find(b => {
                    if (b.doctor_id !== doctor.id) return false;

                    const bookingTime = moment(b.appointment_time, 'HH:mm:ss');
                    const bookingEnd = bookingTime.clone().add(30, 'minutes'); // Mỗi slot 30 phút
                    const currentMoment = moment(currentTime, 'HH:mm:ss');

                    // Kiểm tra xem thời gian hiện tại có nằm trong slot này không
                    return currentMoment.isBetween(bookingTime, bookingEnd, null, '[)');
                });

                // Đếm số lịch hẹn hôm nay của bác sĩ
                const todayAppointments = activeBookings.filter(b => b.doctor_id === doctor.id).length;

                return {
                    id: doctor.id,
                    full_name: doctor.full_name,
                    phone: doctor.phone,
                    avatar: doctor.avatar,
                    specialty: doctor.specialty?.name || 'Chưa phân công',
                    status: currentBooking ? 'busy' : 'available',
                    current_patient: currentBooking ? (currentBooking.patient_name || currentBooking.patient?.full_name) : null,
                    appointment_time: currentBooking ? currentBooking.appointment_time : null,
                    today_appointments: todayAppointments
                };
            });

            // Đếm số lượng theo trạng thái
            const busyCount = doctorStatusList.filter(d => d.status === 'busy').length;
            const availableCount = doctorStatusList.filter(d => d.status === 'available').length;

            res.json({
                doctors: doctorStatusList,
                summary: {
                    total: doctors.length,
                    busy: busyCount,
                    available: availableCount
                }
            });

        } catch (error) {
            console.error('❌ Error fetching doctor status:', error);
            res.status(500).json({
                message: 'Lỗi khi lấy tình trạng bác sĩ',
                error: error.message
            });
        }
    };

}

module.exports = new AdminDashboardController();



