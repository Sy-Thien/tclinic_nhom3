const BaseRepository = require('./BaseRepository');
const { Booking, Patient, Doctor, Service, Specialty, TimeSlot, Room } = require('../Database/Entity');

class BookingRepository extends BaseRepository {
    constructor() {
        super(Booking);
    }

    /**
     * Tìm booking với tất cả relationships
     * @param {number} id 
     */
    async findByIdWithRelations(id) {
        return await this.findById(id, {
            include: [
                { model: Patient, as: 'patient' },
                { model: Doctor, as: 'doctor', include: [{ model: Specialty, as: 'specialty' }] },
                { model: Service, as: 'service' },
                { model: Specialty, as: 'specialty' },
                { model: TimeSlot, as: 'timeSlot', include: [{ model: Room, as: 'room' }] }
            ]
        });
    }

    /**
     * Lấy bookings của patient
     * @param {number} patientId 
     */
    async findByPatient(patientId) {
        return await this.findAll({
            where: { patient_id: patientId },
            include: [
                { model: Doctor, as: 'doctor' },
                { model: Service, as: 'service' },
                { model: TimeSlot, as: 'timeSlot' }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    /**
     * Lấy bookings của doctor theo ngày
     * @param {number} doctorId 
     * @param {string} date 
     */
    async findByDoctorAndDate(doctorId, date) {
        return await this.findAll({
            where: {
                doctor_id: doctorId,
                appointment_date: date
            },
            include: [
                { model: Patient, as: 'patient' },
                { model: Service, as: 'service' },
                { model: TimeSlot, as: 'timeSlot' }
            ],
            order: [['appointment_time', 'ASC']]
        });
    }

    /**
     * Lấy bookings theo status
     * @param {string} status 
     */
    async findByStatus(status) {
        return await this.findAll({
            where: { status },
            include: [
                { model: Patient, as: 'patient' },
                { model: Doctor, as: 'doctor' },
                { model: Service, as: 'service' }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    /**
     * Đếm bookings theo status
     * @param {string} status 
     */
    async countByStatus(status) {
        return await this.count({ status });
    }

    /**
     * Lấy bookings pending cần nhắc nhở
     * @param {Date} reminderDate 
     */
    async findForReminder(reminderDate) {
        const { Op } = require('sequelize');
        return await this.findAll({
            where: {
                appointment_date: reminderDate,
                status: { [Op.in]: ['pending', 'confirmed'] },
                reminder_sent: false
            },
            include: [
                { model: Patient, as: 'patient' },
                { model: Doctor, as: 'doctor' }
            ]
        });
    }
}

module.exports = new BookingRepository();
