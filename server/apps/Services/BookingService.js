const BookingRepository = require('../Repository/BookingRepository');
const TimeSlotRepository = require('../Repository/TimeSlotRepository');
const { Booking, TimeSlot, Patient, Doctor, Service, Specialty } = require('../Database/Entity');
const EmailService = require('./EmailService');

class BookingService {
    /**
     * Tạo booking mới
     * @param {Object} data 
     */
    async createBooking(data) {
        const {
            patient_id,
            doctor_id,
            specialty_id,
            service_id,
            time_slot_id,
            appointment_date,
            appointment_time,
            symptoms,
            notes,
            guest_name,
            guest_phone,
            guest_email
        } = data;

        // Validate time slot if provided
        if (time_slot_id) {
            const timeSlot = await TimeSlot.findByPk(time_slot_id);
            if (!timeSlot) {
                return { success: false, message: 'Khung giờ không tồn tại' };
            }
            if (!timeSlot.is_available || timeSlot.current_patients >= timeSlot.max_patients) {
                return { success: false, message: 'Khung giờ đã đầy' };
            }
        }

        // Create booking
        const booking = await Booking.create({
            patient_id,
            doctor_id,
            specialty_id,
            service_id,
            time_slot_id,
            appointment_date,
            appointment_time,
            symptoms,
            notes,
            guest_name,
            guest_phone,
            guest_email,
            status: 'pending'
        });

        // Update time slot current_patients
        if (time_slot_id) {
            await TimeSlotRepository.updateCurrentPatients(time_slot_id, 1);
        }

        // Get full booking info
        const fullBooking = await BookingRepository.findByIdWithRelations(booking.id);

        return {
            success: true,
            message: 'Đặt lịch thành công',
            data: fullBooking
        };
    }

    /**
     * Cập nhật trạng thái booking
     * @param {number} bookingId 
     * @param {string} status 
     * @param {string} cancelReason 
     */
    async updateStatus(bookingId, status, cancelReason = null) {
        const booking = await Booking.findByPk(bookingId);
        if (!booking) {
            return { success: false, message: 'Không tìm thấy lịch hẹn' };
        }

        const oldStatus = booking.status;
        const updateData = { status };

        if (status === 'cancelled' && cancelReason) {
            updateData.cancel_reason = cancelReason;
        }

        await booking.update(updateData);

        // If cancelled, release time slot
        if (status === 'cancelled' && booking.time_slot_id && oldStatus !== 'cancelled') {
            await TimeSlotRepository.updateCurrentPatients(booking.time_slot_id, -1);
        }

        return {
            success: true,
            message: 'Cập nhật trạng thái thành công',
            data: await BookingRepository.findByIdWithRelations(bookingId)
        };
    }

    /**
     * Gán bác sĩ cho booking
     * @param {number} bookingId 
     * @param {number} doctorId 
     * @param {number} timeSlotId 
     */
    async assignDoctor(bookingId, doctorId, timeSlotId) {
        const booking = await Booking.findByPk(bookingId);
        if (!booking) {
            return { success: false, message: 'Không tìm thấy lịch hẹn' };
        }

        const doctor = await Doctor.findByPk(doctorId);
        if (!doctor) {
            return { success: false, message: 'Không tìm thấy bác sĩ' };
        }

        // Release old time slot if exists
        if (booking.time_slot_id) {
            await TimeSlotRepository.updateCurrentPatients(booking.time_slot_id, -1);
        }

        // Assign new time slot
        if (timeSlotId) {
            const timeSlot = await TimeSlot.findByPk(timeSlotId);
            if (!timeSlot || !timeSlot.is_available) {
                return { success: false, message: 'Khung giờ không khả dụng' };
            }
            await TimeSlotRepository.updateCurrentPatients(timeSlotId, 1);
        }

        await booking.update({
            doctor_id: doctorId,
            time_slot_id: timeSlotId,
            status: 'confirmed'
        });

        return {
            success: true,
            message: 'Đã gán bác sĩ thành công',
            data: await BookingRepository.findByIdWithRelations(bookingId)
        };
    }

    /**
     * Lấy lịch hẹn của patient
     * @param {number} patientId 
     */
    async getPatientBookings(patientId) {
        return await BookingRepository.findByPatient(patientId);
    }

    /**
     * Lấy lịch hẹn của doctor theo ngày
     * @param {number} doctorId 
     * @param {string} date 
     */
    async getDoctorBookings(doctorId, date) {
        return await BookingRepository.findByDoctorAndDate(doctorId, date);
    }
}

module.exports = new BookingService();
