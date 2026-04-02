const BaseRepository = require('./BaseRepository');
const { TimeSlot, Doctor, Room, Booking } = require('../Database/Entity');
const { Op } = require('sequelize');

class TimeSlotRepository extends BaseRepository {
    constructor() {
        super(TimeSlot);
    }

    /**
     * Lấy timeslots của doctor theo ngày
     * @param {number} doctorId 
     * @param {string} date 
     */
    async findByDoctorAndDate(doctorId, date) {
        return await this.findAll({
            where: {
                doctor_id: doctorId,
                slot_date: date
            },
            include: [{ model: Room, as: 'room' }],
            order: [['start_time', 'ASC']]
        });
    }

    /**
     * Lấy timeslots có chỗ trống
     * @param {number} doctorId 
     * @param {string} date 
     */
    async findAvailable(doctorId, date) {
        return await this.findAll({
            where: {
                doctor_id: doctorId,
                slot_date: date,
                is_available: true
            },
            include: [{ model: Room, as: 'room' }],
            order: [['start_time', 'ASC']]
        });
    }

    /**
     * Lấy timeslots trong khoảng thời gian
     * @param {number} doctorId 
     * @param {string} startDate 
     * @param {string} endDate 
     */
    async findByDateRange(doctorId, startDate, endDate) {
        return await this.findAll({
            where: {
                doctor_id: doctorId,
                slot_date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [{ model: Room, as: 'room' }],
            order: [['slot_date', 'ASC'], ['start_time', 'ASC']]
        });
    }

    /**
     * Cập nhật số bệnh nhân hiện tại
     * @param {number} id 
     * @param {number} change - Số thay đổi (+1 hoặc -1)
     */
    async updateCurrentPatients(id, change) {
        const timeSlot = await this.findById(id);
        if (!timeSlot) return null;

        const newCount = Math.max(0, timeSlot.current_patients + change);
        const isAvailable = newCount < timeSlot.max_patients;

        return await timeSlot.update({
            current_patients: newCount,
            is_available: isAvailable
        });
    }
}

module.exports = new TimeSlotRepository();
