const { Patient, Booking, Doctor, Specialty, Service } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// ✅ POST - Tạo bệnh nhân walk-in và booking khám ngay
exports.createWalkInPatient = async (req, res) => {
    try {
        const {
            // Thông tin bệnh nhân
            full_name,
            phone,
            email,
            gender,
            birthday,
            address,
            // Thông tin khám
            specialty_id,
            service_id,
            symptoms,
            note
        } = req.body;

        const doctor_id = req.user.id;

        console.log('🚶 POST /api/doctor/walk-in', { full_name, phone, doctor_id });

        // Validate required fields
        if (!full_name || !phone || !symptoms) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ: Họ tên, SĐT, Triệu chứng'
            });
        }

        // Lấy thông tin bác sĩ để có specialty_id
        const doctor = await Doctor.findByPk(doctor_id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin bác sĩ'
            });
        }

        // Kiểm tra bệnh nhân đã tồn tại (theo SĐT)
        let patient = await Patient.findOne({
            where: { phone }
        });

        let isNewPatient = false;

        if (!patient) {
            // Tạo bệnh nhân mới (không có password - walk-in)
            patient = await Patient.create({
                full_name,
                phone,
                email: email || null,
                gender: gender || 'other',
                birthday: birthday || null,
                address: address || null,
                password: null, // Walk-in không có password
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            });
            isNewPatient = true;
            console.log('✅ Created new walk-in patient:', patient.id);
        } else {
            // Cập nhật thông tin nếu có thay đổi
            await patient.update({
                full_name,
                email: email || patient.email,
                gender: gender || patient.gender,
                birthday: birthday || patient.birthday,
                address: address || patient.address,
                updated_at: new Date()
            });
            console.log('✅ Updated existing patient:', patient.id);
        }

        // Tạo booking code
        const bookingCode = 'BK' + Date.now().toString().slice(-8);
        const today = new Date();
        const appointmentDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentTime = today.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

        // Tạo booking
        const booking = await Booking.create({
            booking_code: bookingCode,
            patient_id: patient.id,
            patient_name: full_name,
            patient_email: email || null,
            patient_phone: phone,
            patient_gender: gender || 'other',
            patient_dob: birthday || null,
            patient_address: address || null,
            doctor_id: doctor_id,
            specialty_id: specialty_id || doctor.specialty_id,
            service_id: service_id || 1,
            appointment_date: appointmentDate,
            appointment_time: currentTime,
            symptoms,
            note: note || 'Khám trực tiếp (Walk-in)',
            status: 'confirmed', // Đã xác nhận ngay
            booking_type: 'walk_in', // Đánh dấu là walk-in
            created_at: new Date(),
            updated_at: new Date()
        });

        console.log('✅ Created walk-in booking:', booking.id);

        res.status(201).json({
            success: true,
            message: isNewPatient
                ? 'Tạo hồ sơ bệnh nhân mới và lịch khám thành công'
                : 'Tạo lịch khám cho bệnh nhân cũ thành công',
            patient: {
                id: patient.id,
                full_name: patient.full_name,
                phone: patient.phone,
                email: patient.email,
                gender: patient.gender,
                birthday: patient.birthday,
                address: patient.address,
                is_new: isNewPatient
            },
            booking: {
                id: booking.id,
                booking_code: booking.booking_code,
                appointment_date: booking.appointment_date,
                appointment_time: booking.appointment_time,
                status: booking.status
            }
        });

    } catch (error) {
        console.error('❌ Error creating walk-in patient:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ GET - Tìm bệnh nhân theo SĐT (để check đã có hồ sơ chưa)
exports.searchPatientByPhone = async (req, res) => {
    try {
        const { phone } = req.query;

        if (!phone || phone.length < 4) {
            return res.json({ patients: [] });
        }

        const patients = await Patient.findAll({
            where: {
                phone: {
                    [Op.like]: `%${phone}%`
                }
            },
            attributes: ['id', 'full_name', 'phone', 'email', 'gender', 'birthday', 'address'],
            limit: 10
        });

        res.json({ patients });

    } catch (error) {
        console.error('❌ Error searching patient:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ GET - Lấy danh sách bệnh nhân walk-in hôm nay của bác sĩ
exports.getTodayWalkIns = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const walkIns = await Booking.findAll({
            where: {
                doctor_id,
                appointment_date: today,
                booking_type: 'walk_in'
            },
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'phone', 'email', 'gender', 'birthday']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            count: walkIns.length,
            walkIns
        });

    } catch (error) {
        console.error('❌ Error getting walk-ins:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ GET - Lấy lịch sử khám của bệnh nhân (để bác sĩ xem)
exports.getPatientHistory = async (req, res) => {
    try {
        const { patient_id } = req.params;

        const bookings = await Booking.findAll({
            where: {
                patient_id,
                status: 'completed'
            },
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name']
                },
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            order: [['appointment_date', 'DESC']],
            limit: 20
        });

        res.json({
            success: true,
            count: bookings.length,
            history: bookings
        });

    } catch (error) {
        console.error('❌ Error getting patient history:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};
