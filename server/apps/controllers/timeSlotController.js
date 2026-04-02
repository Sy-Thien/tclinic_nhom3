const { TimeSlot, Doctor, Room, Booking, Specialty } = require('../Database/Entity');
const { Op } = require('sequelize');

// ADMIN - Tạo time slot mới

class TimeSlotController {
        async createTimeSlot(req, res) {
        try {
            const { doctor_id, date, start_time, end_time, max_patients, room_id, note } = req.body;

            // Kiểm tra doctor tồn tại
            const doctor = await Doctor.findByPk(doctor_id);
            if (!doctor) {
                return res.status(404).json({ message: 'Bác sĩ không tồn tại' });
            }

            // Kiểm tra trùng lặp
            const existingSlot = await TimeSlot.findOne({
                where: {
                    doctor_id,
                    date,
                    start_time
                }
            });

            if (existingSlot) {
                return res.status(400).json({ message: 'Khung giờ này đã tồn tại' });
            }

            const timeSlot = await TimeSlot.create({
                doctor_id,
                date,
                start_time,
                end_time,
                max_patients: max_patients || 1,
                current_patients: 0,
                is_available: true,
                room_id,
                note
            });

            res.status(201).json({
                message: 'Tạo khung giờ thành công',
                timeSlot
            });
        } catch (error) {
            console.error('Error creating time slot:', error);
            res.status(500).json({ message: 'Lỗi tạo khung giờ', error: error.message });
        }
    };

    // ADMIN - Tạo nhiều time slots cùng lúc
        async createMultipleTimeSlots(req, res) {
        try {
            const { doctor_id, date, slots, room_id } = req.body;
            // slots = [{ start_time, end_time, max_patients }, ...]

            const doctor = await Doctor.findByPk(doctor_id);
            if (!doctor) {
                return res.status(404).json({ message: 'Bác sĩ không tồn tại' });
            }

            const timeSlots = [];
            for (const slot of slots) {
                const existing = await TimeSlot.findOne({
                    where: { doctor_id, date, start_time: slot.start_time }
                });

                if (!existing) {
                    const newSlot = await TimeSlot.create({
                        doctor_id,
                        date,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        max_patients: slot.max_patients || 1,
                        current_patients: 0,
                        is_available: true,
                        room_id
                    });
                    timeSlots.push(newSlot);
                }
            }

            res.status(201).json({
                message: `Đã tạo ${timeSlots.length} khung giờ`,
                timeSlots
            });
        } catch (error) {
            console.error('Error creating multiple time slots:', error);
            res.status(500).json({ message: 'Lỗi tạo khung giờ', error: error.message });
        }
    };

    // ADMIN - Lấy danh sách time slots (có filter)
        async getTimeSlots(req, res) {
        try {
            const { doctor_id, date, start_date, end_date, is_available } = req.query;

            const where = {};
            if (doctor_id) where.doctor_id = doctor_id;
            if (date) where.date = date;
            if (start_date && end_date) {
                where.date = { [Op.between]: [start_date, end_date] };
            }
            if (is_available !== undefined) where.is_available = is_available === 'true';

            const timeSlots = await TimeSlot.findAll({
                where,
                include: [
                    {
                        model: Doctor,
                        as: 'doctor',
                        attributes: ['id', 'full_name', 'email', 'phone', 'specialty_id'],
                        include: [
                            {
                                model: Specialty,
                                as: 'specialty',
                                attributes: ['id', 'name']
                            }
                        ]
                    },
                    {
                        model: Room,
                        as: 'room',
                        attributes: ['id', 'name', 'floor']
                    }
                ],
                order: [['date', 'ASC'], ['start_time', 'ASC']]
            });

            res.json(timeSlots);
        } catch (error) {
            console.error('Error fetching time slots:', error);
            res.status(500).json({ message: 'Lỗi lấy danh sách khung giờ', error: error.message });
        }
    };

    // ADMIN - Cập nhật time slot
        async updateTimeSlot(req, res) {
        try {
            const { id } = req.params;
            const { start_time, end_time, max_patients, is_available, room_id, note } = req.body;

            const timeSlot = await TimeSlot.findByPk(id);
            if (!timeSlot) {
                return res.status(404).json({ message: 'Không tìm thấy khung giờ' });
            }

            await timeSlot.update({
                start_time: start_time || timeSlot.start_time,
                end_time: end_time || timeSlot.end_time,
                max_patients: max_patients !== undefined ? max_patients : timeSlot.max_patients,
                is_available: is_available !== undefined ? is_available : timeSlot.is_available,
                room_id: room_id !== undefined ? room_id : timeSlot.room_id,
                note: note !== undefined ? note : timeSlot.note
            });

            res.json({
                message: 'Cập nhật khung giờ thành công',
                timeSlot
            });
        } catch (error) {
            console.error('Error updating time slot:', error);
            res.status(500).json({ message: 'Lỗi cập nhật khung giờ', error: error.message });
        }
    };

    // ADMIN - Xóa time slot
        async deleteTimeSlot(req, res) {
        try {
            const { id } = req.params;

            const timeSlot = await TimeSlot.findByPk(id);
            if (!timeSlot) {
                return res.status(404).json({ message: 'Không tìm thấy khung giờ' });
            }

            // Kiểm tra xem đã có booking chưa
            if (timeSlot.current_patients > 0) {
                return res.status(400).json({ message: 'Không thể xóa khung giờ đã có bệnh nhân đặt' });
            }

            await timeSlot.destroy();

            res.json({ message: 'Xóa khung giờ thành công' });
        } catch (error) {
            console.error('Error deleting time slot:', error);
            res.status(500).json({ message: 'Lỗi xóa khung giờ', error: error.message });
        }
    };

    // USER/PUBLIC - Lấy time slots có sẵn cho booking
        async getAvailableTimeSlots(req, res) {
        try {
            const { doctor_id, date, specialty_id } = req.query;

            const where = {
                is_available: true,
                date: {
                    [Op.gte]: new Date().toISOString().split('T')[0] // Chỉ lấy từ hôm nay trở đi
                }
            };

            if (doctor_id) where.doctor_id = doctor_id;
            if (date) where.date = date;

            // Lọc theo chuyên khoa nếu có
            const include = [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name', 'specialty_id'],
                    where: specialty_id ? { specialty_id } : {},
                    include: [
                        {
                            model: Specialty,
                            as: 'specialty',
                            attributes: ['id', 'name']
                        }
                    ]
                },
                {
                    model: Room,
                    as: 'room',
                    attributes: ['id', 'name', 'floor']
                }
            ];

            const timeSlots = await TimeSlot.findAll({
                where,
                include,
                order: [['date', 'ASC'], ['start_time', 'ASC']]
            });

            // Filter những slot còn chỗ
            const availableSlots = timeSlots.filter(slot => slot.current_patients < slot.max_patients);

            res.json(availableSlots);
        } catch (error) {
            console.error('Error fetching available time slots:', error);
            res.status(500).json({ message: 'Lỗi lấy danh sách khung giờ', error: error.message });
        }
    };

    // Hàm helper để tăng số lượng bệnh nhân trong slot (gọi khi tạo booking)
        async incrementPatientCount(timeSlotId) {
        try {
            const timeSlot = await TimeSlot.findByPk(timeSlotId);
            if (!timeSlot) {
                throw new Error('Time slot không tồn tại');
            }

            if (timeSlot.current_patients >= timeSlot.max_patients) {
                throw new Error('Khung giờ đã đầy');
            }

            await timeSlot.increment('current_patients');

            // Nếu đã đầy thì đánh dấu không available
            if (timeSlot.current_patients + 1 >= timeSlot.max_patients) {
                await timeSlot.update({ is_available: false });
            }

            return timeSlot;
        } catch (error) {
            throw error;
        }
    };

    // Hàm helper để giảm số lượng bệnh nhân (gọi khi hủy booking)
        async decrementPatientCount(timeSlotId) {
        try {
            const timeSlot = await TimeSlot.findByPk(timeSlotId);
            if (!timeSlot) {
                throw new Error('Time slot không tồn tại');
            }

            if (timeSlot.current_patients > 0) {
                await timeSlot.decrement('current_patients');
                await timeSlot.update({ is_available: true });
            }

            return timeSlot;
        } catch (error) {
            throw error;
        }
    };

    // DOCTOR - Xem time slots của mình
        async getDoctorTimeSlots(req, res) {
        try {
            const doctorId = req.user.id; // Từ auth middleware
            const { date, start_date, end_date } = req.query;

            const where = { doctor_id: doctorId };
            if (date) where.date = date;
            if (start_date && end_date) {
                where.date = { [Op.between]: [start_date, end_date] };
            }

            const timeSlots = await TimeSlot.findAll({
                where,
                include: [
                    {
                        model: Room,
                        as: 'room',
                        attributes: ['id', 'name', 'floor']
                    },
                    {
                        model: Booking,
                        as: 'bookings',
                        attributes: ['id', 'booking_code', 'patient_name', 'patient_phone', 'status', 'appointment_date', 'appointment_time', 'specialty_id']
                    }
                ],
                order: [['date', 'ASC'], ['start_time', 'ASC']]
            });

            res.json(timeSlots);
        } catch (error) {
            console.error('Error fetching doctor time slots:', error);
            res.status(500).json({ message: 'Lỗi lấy lịch làm việc', error: error.message });
        }
    };

}

module.exports = new TimeSlotController();



