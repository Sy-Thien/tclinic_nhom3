#!/usr/bin/env node

const sequelize = require('./config/database');
const { TimeSlot, Doctor, Room } = require('./models');

async function seedTimeSlots() {
    try {
        console.log('🌱 Đang thêm dữ liệu sample time slots...');

        // Lấy doctor đầu tiên
        const doctor = await Doctor.findByPk(1);
        if (!doctor) {
            console.log('❌ Không tìm thấy doctor với id 1');
            process.exit(1);
        }

        // Lấy room đầu tiên
        const room = await Room.findByPk(1);

        // Ngày để test
        const today = new Date();
        const testDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

        console.log(`📅 Tạo time slots cho ngày: ${testDate}`);
        console.log(`👨‍⚕️ Bác sĩ: ${doctor.full_name}`);

        // Tạo các khung giờ
        const timeSlots = [
            { start_time: '08:00', end_time: '08:30', max_patients: 2 },
            { start_time: '08:30', end_time: '09:00', max_patients: 2 },
            { start_time: '09:00', end_time: '09:30', max_patients: 2 },
            { start_time: '09:30', end_time: '10:00', max_patients: 2 },
            { start_time: '10:00', end_time: '10:30', max_patients: 2 },
            { start_time: '10:30', end_time: '11:00', max_patients: 2 },
            { start_time: '11:00', end_time: '11:30', max_patients: 2 },
            // Giờ nghỉ trưa: 12:00 - 13:00
            { start_time: '13:00', end_time: '13:30', max_patients: 2 },
            { start_time: '13:30', end_time: '14:00', max_patients: 2 },
            { start_time: '14:00', end_time: '14:30', max_patients: 2 },
            { start_time: '14:30', end_time: '15:00', max_patients: 2 },
            { start_time: '15:00', end_time: '15:30', max_patients: 2 },
            { start_time: '15:30', end_time: '16:00', max_patients: 2 },
            { start_time: '16:00', end_time: '16:30', max_patients: 2 },
            { start_time: '16:30', end_time: '17:00', max_patients: 2 }
        ];

        let created = 0;
        for (const slot of timeSlots) {
            const existing = await TimeSlot.findOne({
                where: {
                    doctor_id: doctor.id,
                    date: testDate,
                    start_time: slot.start_time
                }
            });

            if (!existing) {
                await TimeSlot.create({
                    doctor_id: doctor.id,
                    date: testDate,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    max_patients: slot.max_patients,
                    current_patients: 0,
                    is_available: true,
                    room_id: room?.id || null
                });
                created++;
            }
        }

        console.log(`✅ Đã tạo ${created} khung giờ`);

        // Kiểm tra số slots đã tạo
        const count = await TimeSlot.count({
            where: {
                doctor_id: doctor.id,
                date: testDate
            }
        });

        console.log(`📊 Tổng cộng: ${count} khung giờ cho ngày ${testDate}`);
        console.log('✨ Hoàn thành!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

seedTimeSlots();
