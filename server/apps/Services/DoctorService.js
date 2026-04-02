const DoctorRepository = require('../Repository/DoctorRepository');
const TimeSlotRepository = require('../Repository/TimeSlotRepository');
const { Doctor, DoctorSchedule, TimeSlot, Room } = require('../Database/Entity');
const { Op } = require('sequelize');

class DoctorService {
    /**
     * Lấy danh sách bác sĩ theo chuyên khoa
     * @param {number} specialtyId 
     */
    async getDoctorsBySpecialty(specialtyId) {
        return await DoctorRepository.findBySpecialty(specialtyId);
    }

    /**
     * Lấy thông tin chi tiết bác sĩ
     * @param {number} doctorId 
     */
    async getDoctorDetail(doctorId) {
        return await DoctorRepository.findByIdWithSpecialty(doctorId);
    }

    /**
     * Tìm kiếm bác sĩ
     * @param {string} keyword 
     */
    async searchDoctors(keyword) {
        return await DoctorRepository.search(keyword);
    }

    /**
     * Lấy lịch làm việc của bác sĩ theo tuần
     * @param {number} doctorId 
     */
    async getDoctorSchedule(doctorId) {
        return await DoctorSchedule.findAll({
            where: { doctor_id: doctorId },
            order: [['day_of_week', 'ASC']]
        });
    }

    /**
     * Lấy time slots khả dụng của bác sĩ
     * @param {number} doctorId 
     * @param {string} date 
     */
    async getAvailableSlots(doctorId, date) {
        return await TimeSlotRepository.findAvailable(doctorId, date);
    }

    /**
     * Tạo time slots từ lịch làm việc
     * @param {number} doctorId 
     * @param {string} startDate 
     * @param {string} endDate 
     */
    async generateTimeSlots(doctorId, startDate, endDate) {
        const schedules = await DoctorSchedule.findAll({
            where: { doctor_id: doctorId }
        });

        if (!schedules.length) {
            return { success: false, message: 'Bác sĩ chưa có lịch làm việc' };
        }

        const slots = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            const schedule = schedules.find(s => s.day_of_week === dayOfWeek);

            if (schedule) {
                // Generate 30-minute slots
                const slotDate = d.toISOString().split('T')[0];
                const [startHour, startMin] = schedule.start_time.split(':').map(Number);
                const [endHour, endMin] = schedule.end_time.split(':').map(Number);

                let currentTime = startHour * 60 + startMin;
                const endTime = endHour * 60 + endMin;

                while (currentTime < endTime) {
                    const hour = Math.floor(currentTime / 60);
                    const min = currentTime % 60;
                    const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;

                    const nextTime = currentTime + 30;
                    const nextHour = Math.floor(nextTime / 60);
                    const nextMin = nextTime % 60;
                    const endTimeStr = `${nextHour.toString().padStart(2, '0')}:${nextMin.toString().padStart(2, '0')}:00`;

                    slots.push({
                        doctor_id: doctorId,
                        slot_date: slotDate,
                        start_time: timeStr,
                        end_time: endTimeStr,
                        max_patients: schedule.max_patients || 1,
                        current_patients: 0,
                        is_available: true
                    });

                    currentTime = nextTime;
                }
            }
        }

        if (slots.length > 0) {
            // Delete existing slots in date range
            await TimeSlot.destroy({
                where: {
                    doctor_id: doctorId,
                    slot_date: { [Op.between]: [startDate, endDate] }
                }
            });

            // Create new slots
            await TimeSlot.bulkCreate(slots);
        }

        return {
            success: true,
            message: `Đã tạo ${slots.length} khung giờ`,
            count: slots.length
        };
    }
}

module.exports = new DoctorService();
