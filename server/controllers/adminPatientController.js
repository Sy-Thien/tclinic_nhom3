const { Patient, Booking, Doctor, Specialty, MedicalHistory, Prescription, PrescriptionDetail, Drug } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

// GET - Lấy danh sách tất cả bệnh nhân
exports.getAllPatients = async (req, res) => {
    try {
        const { search, status } = req.query;

        console.log('📋 GET /api/admin/patients', { search, status });

        let whereClause = {};

        // Tìm kiếm theo tên, email, phone
        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } }
            ];
        }

        // Lọc theo trạng thái
        if (status !== undefined && status !== 'all') {
            whereClause.is_active = status === 'active';
        }

        const patients = await Patient.findAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            order: [['id', 'ASC']]
        });

        console.log(`✅ Found ${patients.length} patients`);

        res.json(patients);
    } catch (error) {
        console.error('❌ Error fetching patients:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách bệnh nhân',
            error: error.message
        });
    }
};

// GET - Lấy thông tin chi tiết 1 bệnh nhân
exports.getPatientById = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`📋 GET /api/admin/patients/${id}`);

        const patient = await Patient.findByPk(id, {
            attributes: { exclude: ['password'] }
        });

        if (!patient) {
            return res.status(404).json({ message: 'Không tìm thấy bệnh nhân' });
        }

        console.log('✅ Patient found:', patient.full_name);

        res.json(patient);
    } catch (error) {
        console.error('❌ Error fetching patient:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy thông tin bệnh nhân',
            error: error.message
        });
    }
};

// GET - Lấy lịch sử khám của bệnh nhân (Admin xem TẤT CẢ)
exports.getPatientHistory = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`📋 GET /api/admin/patients/${id}/history`);

        const bookings = await Booking.findAll({
            where: {
                patient_id: id
            },
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                },
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name', 'phone'],
                    required: false
                }
            ],
            order: [['appointment_date', 'DESC'], ['id', 'ASC']]
        });

        console.log(`✅ Found ${bookings.length} booking records`);

        res.json(bookings);
    } catch (error) {
        console.error('❌ Error fetching patient history:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy lịch sử khám',
            error: error.message
        });
    }
};

// GET - Lấy chi tiết hồ sơ bệnh án (Admin xem TẤT CẢ bệnh án của bệnh nhân)
exports.getPatientMedicalRecords = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`📋 GET /api/admin/patients/${id}/medical-records`);

        // Kiểm tra bệnh nhân tồn tại
        const patient = await Patient.findByPk(id, {
            attributes: ['id', 'full_name', 'phone', 'email', 'gender', 'birthday', 'address']
        });

        if (!patient) {
            return res.status(404).json({ message: 'Không tìm thấy bệnh nhân' });
        }

        // Lấy TẤT CẢ hồ sơ bệnh án của bệnh nhân (không lọc theo doctor_id)
        const medicalRecords = await MedicalHistory.findAll({
            where: { patient_id: id },
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name'],
                    include: [
                        { model: Specialty, as: 'specialty', attributes: ['name'] }
                    ]
                },
                {
                    model: Booking,
                    as: 'booking',
                    attributes: ['id', 'booking_code', 'status']
                },
                {
                    model: Prescription,
                    as: 'prescription',
                    include: [
                        {
                            model: PrescriptionDetail,
                            as: 'details',
                            include: [
                                { model: Drug, as: 'drug', attributes: ['name', 'unit', 'ingredient'] }
                            ]
                        }
                    ]
                }
            ],
            order: [['visit_date', 'DESC'], ['visit_time', 'DESC']]
        });

        console.log(`✅ Found ${medicalRecords.length} medical records`);

        res.json({
            success: true,
            patient,
            totalRecords: medicalRecords.length,
            medicalRecords
        });
    } catch (error) {
        console.error('❌ Error fetching patient medical records:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy hồ sơ bệnh án',
            error: error.message
        });
    }
};

// PUT - Admin cập nhật triệu chứng/ghi chú cho bệnh án
exports.updateMedicalRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { symptoms, diagnosis, conclusion, note } = req.body;

        console.log(`✏️ PUT /api/admin/medical-records/${id}`);

        const record = await MedicalHistory.findByPk(id);
        if (!record) {
            return res.status(404).json({ message: 'Không tìm thấy bệnh án' });
        }

        // Cập nhật
        await record.update({
            symptoms: symptoms !== undefined ? symptoms : record.symptoms,
            diagnosis: diagnosis !== undefined ? diagnosis : record.diagnosis,
            conclusion: conclusion !== undefined ? conclusion : record.conclusion,
            note: note !== undefined ? note : record.note
        });

        console.log('✅ Medical record updated:', id);

        res.json({
            success: true,
            message: 'Cập nhật hồ sơ bệnh án thành công',
            record
        });
    } catch (error) {
        console.error('❌ Error updating medical record:', error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật hồ sơ bệnh án',
            error: error.message
        });
    }
};

// POST - Thêm bệnh nhân mới
exports.createPatient = async (req, res) => {
    try {
        const {
            email,
            password,
            full_name,
            phone,
            gender,
            birthday,
            address
        } = req.body;

        console.log('➕ POST /api/admin/patients', { email, full_name });

        // Validation
        if (!full_name || !phone) {
            return res.status(400).json({
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc (họ tên, số điện thoại)'
            });
        }

        // Kiểm tra email đã tồn tại (nếu có email)
        if (email) {
            const existingPatient = await Patient.findOne({ where: { email } });
            if (existingPatient) {
                return res.status(400).json({
                    message: 'Email đã được sử dụng'
                });
            }
        }

        // Hash password nếu có
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Tạo bệnh nhân mới
        const patient = await Patient.create({
            email: email || null,
            password: hashedPassword,
            full_name,
            phone,
            gender: gender || 'other',
            birthday: birthday || null,
            address: address || null,
            is_active: true
        });

        // Lấy lại thông tin bệnh nhân (không có password)
        const patientData = await Patient.findByPk(patient.id, {
            attributes: { exclude: ['password'] }
        });

        console.log('✅ Patient created:', patient.id);

        res.status(201).json({
            message: 'Thêm bệnh nhân thành công',
            patient: patientData
        });
    } catch (error) {
        console.error('❌ Error creating patient:', error);
        res.status(500).json({
            message: 'Lỗi khi thêm bệnh nhân',
            error: error.message
        });
    }
};

// PUT - Cập nhật thông tin bệnh nhân
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            email,
            password,
            full_name,
            phone,
            gender,
            birthday,
            address,
            is_active
        } = req.body;

        console.log(`✏️ PUT /api/admin/patients/${id}`);

        // Tìm bệnh nhân
        const patient = await Patient.findByPk(id);
        if (!patient) {
            return res.status(404).json({ message: 'Không tìm thấy bệnh nhân' });
        }

        // Kiểm tra email trùng (nếu thay đổi email)
        if (email && email !== patient.email) {
            const existingPatient = await Patient.findOne({ where: { email } });
            if (existingPatient) {
                return res.status(400).json({
                    message: 'Email đã được sử dụng'
                });
            }
        }

        // Chuẩn bị dữ liệu update
        const updateData = {
            email: email || patient.email,
            full_name: full_name || patient.full_name,
            phone: phone || patient.phone,
            gender: gender || patient.gender,
            birthday: birthday !== undefined ? birthday : patient.birthday,
            address: address !== undefined ? address : patient.address,
            is_active: is_active !== undefined ? is_active : patient.is_active,
            updated_at: new Date()
        };

        // Nếu có password mới, hash và cập nhật
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Cập nhật
        await patient.update(updateData);

        // Lấy lại thông tin bệnh nhân
        const updatedPatient = await Patient.findByPk(id, {
            attributes: { exclude: ['password'] }
        });

        console.log('✅ Patient updated:', id);

        res.json({
            message: 'Cập nhật thông tin bệnh nhân thành công',
            patient: updatedPatient
        });
    } catch (error) {
        console.error('❌ Error updating patient:', error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật thông tin bệnh nhân',
            error: error.message
        });
    }
};

// DELETE - Xóa bệnh nhân
exports.deletePatient = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🗑️ DELETE /api/admin/patients/${id}`);

        const patient = await Patient.findByPk(id);
        if (!patient) {
            return res.status(404).json({ message: 'Không tìm thấy bệnh nhân' });
        }

        // Kiểm tra xem bệnh nhân có lịch khám không
        const bookingCount = await Booking.count({
            where: { patient_id: id }
        });

        if (bookingCount > 0) {
            return res.status(400).json({
                message: `Không thể xóa bệnh nhân đã có ${bookingCount} lịch khám. Vui lòng vô hiệu hóa thay vì xóa.`
            });
        }

        // Xóa bệnh nhân
        await patient.destroy();

        console.log('✅ Patient deleted:', id);

        res.json({
            message: 'Xóa bệnh nhân thành công'
        });
    } catch (error) {
        console.error('❌ Error deleting patient:', error);
        res.status(500).json({
            message: 'Lỗi khi xóa bệnh nhân',
            error: error.message
        });
    }
};

// PUT - Toggle trạng thái active/inactive
exports.togglePatientStatus = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🔄 PUT /api/admin/patients/${id}/toggle-status`);

        const patient = await Patient.findByPk(id);
        if (!patient) {
            return res.status(404).json({ message: 'Không tìm thấy bệnh nhân' });
        }

        // Toggle is_active
        await patient.update({
            is_active: !patient.is_active,
            updated_at: new Date()
        });

        console.log('✅ Patient status toggled:', id, '→', patient.is_active);

        res.json({
            message: `${patient.is_active ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản bệnh nhân thành công`,
            is_active: patient.is_active
        });
    } catch (error) {
        console.error('❌ Error toggling patient status:', error);
        res.status(500).json({
            message: 'Lỗi khi thay đổi trạng thái bệnh nhân',
            error: error.message
        });
    }
};

// DELETE - Cleanup test patient by email (for API testing)
exports.cleanupPatient = async (req, res) => {
    try {
        const { email } = req.query;

        console.log(`🧹 DELETE /api/admin/patients/cleanup - email: ${email}`);

        if (!email) {
            return res.status(400).json({ message: 'Email là bắt buộc' });
        }

        const patient = await Patient.findOne({ where: { email } });

        if (!patient) {
            return res.status(404).json({ message: 'Không tìm thấy bệnh nhân' });
        }

        await patient.destroy();

        console.log('✅ Test patient cleaned up:', email);

        res.json({
            message: 'Xóa bệnh nhân test thành công',
            deleted_email: email
        });
    } catch (error) {
        console.error('❌ Error cleaning up patient:', error);
        res.status(500).json({
            message: 'Lỗi khi xóa bệnh nhân test',
            error: error.message
        });
    }
};

module.exports = exports;
