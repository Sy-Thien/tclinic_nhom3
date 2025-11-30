const { Doctor, Specialty, DoctorSchedule } = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

// Các ngày trong tuần
const WEEK_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

// Hàm tạo lịch làm việc mặc định cho bác sĩ mới
async function createDefaultScheduleForDoctor(doctorId) {
    const schedules = [];

    for (const day of WEEK_DAYS) {
        // Thứ 7 & CN: Làm nửa ngày (sáng)
        const isWeekend = day === 'Thứ 7' || day === 'Chủ nhật';

        schedules.push({
            doctor_id: doctorId,
            day_of_week: day,
            start_time: '08:00:00',
            end_time: isWeekend ? '12:00:00' : '17:00:00',
            break_start: isWeekend ? null : '12:00:00',
            break_end: isWeekend ? null : '13:30:00',
            is_active: true,
            room: null
        });
    }

    await DoctorSchedule.bulkCreate(schedules);
    console.log(`📅 Đã tạo ${schedules.length} lịch làm việc mặc định cho bác sĩ ID ${doctorId}`);
}

// GET - Lấy danh sách tất cả bác sĩ
exports.getAllDoctors = async (req, res) => {
    try {
        const { search, specialty_id, status } = req.query;

        console.log('📋 GET /api/admin/doctors', { search, specialty_id, status });

        let whereClause = {};

        // Tìm kiếm theo tên, email, phone
        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } }
            ];
        }

        // Lọc theo chuyên khoa
        if (specialty_id) {
            whereClause.specialty_id = specialty_id;
        }

        // Lọc theo trạng thái
        if (status !== undefined && status !== 'all') {
            whereClause.is_active = status === 'active';
        }

        const doctors = await Doctor.findAll({
            where: whereClause,
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            attributes: { exclude: ['password', 'recovery_token'] },
            order: [['id', 'ASC']]
        });

        console.log(`✅ Found ${doctors.length} doctors`);

        res.json(doctors);
    } catch (error) {
        console.error('❌ Error fetching doctors:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách bác sĩ',
            error: error.message
        });
    }
};

// GET - Lấy thông tin chi tiết 1 bác sĩ
exports.getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`📋 GET /api/admin/doctors/${id}`);

        const doctor = await Doctor.findByPk(id, {
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name', 'description']
                }
            ],
            attributes: { exclude: ['password', 'recovery_token'] }
        });

        if (!doctor) {
            return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
        }

        console.log('✅ Doctor found:', doctor.full_name);

        res.json(doctor);
    } catch (error) {
        console.error('❌ Error fetching doctor:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy thông tin bác sĩ',
            error: error.message
        });
    }
};

// POST - Thêm bác sĩ mới
exports.createDoctor = async (req, res) => {
    try {
        const {
            email,
            password,
            full_name,
            phone,
            gender,
            specialty_id,
            experience,
            education,
            description
        } = req.body;

        console.log('➕ POST /api/admin/doctors', { email, full_name });

        // Validation
        if (!email || !password || !full_name || !phone) {
            return res.status(400).json({
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc (email, password, họ tên, số điện thoại)'
            });
        }

        // Kiểm tra email đã tồn tại
        const existingDoctor = await Doctor.findOne({ where: { email } });
        if (existingDoctor) {
            return res.status(400).json({
                message: 'Email đã được sử dụng'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo bác sĩ mới
        const doctor = await Doctor.create({
            email,
            password: hashedPassword,
            full_name,
            phone,
            gender: gender || 'other',
            specialty_id: specialty_id || null,
            experience: experience || null,
            education: education || null,
            description: description || null,
            is_active: true
        });

        // Lấy lại thông tin bác sĩ với specialty
        const doctorWithSpecialty = await Doctor.findByPk(doctor.id, {
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            attributes: { exclude: ['password', 'recovery_token'] }
        });

        // ✅ Tự động tạo lịch làm việc mặc định cho bác sĩ mới
        try {
            await createDefaultScheduleForDoctor(doctor.id);
        } catch (scheduleError) {
            console.error('⚠️ Lỗi tạo lịch mặc định:', scheduleError.message);
            // Không throw lỗi, vẫn trả về thành công vì bác sĩ đã được tạo
        }

        console.log('✅ Doctor created:', doctor.id);

        res.status(201).json({
            message: 'Thêm bác sĩ thành công (đã tạo lịch làm việc mặc định)',
            doctor: doctorWithSpecialty
        });
    } catch (error) {
        console.error('❌ Error creating doctor:', error);
        res.status(500).json({
            message: 'Lỗi khi thêm bác sĩ',
            error: error.message
        });
    }
};

// PUT - Cập nhật thông tin bác sĩ
exports.updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            email,
            password,
            full_name,
            phone,
            gender,
            specialty_id,
            experience,
            education,
            description,
            is_active
        } = req.body;

        console.log(`✏️ PUT /api/admin/doctors/${id}`);

        // Tìm bác sĩ
        const doctor = await Doctor.findByPk(id);
        if (!doctor) {
            return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
        }

        // Kiểm tra email trùng (nếu thay đổi email)
        if (email && email !== doctor.email) {
            const existingDoctor = await Doctor.findOne({ where: { email } });
            if (existingDoctor) {
                return res.status(400).json({
                    message: 'Email đã được sử dụng'
                });
            }
        }

        // Chuẩn bị dữ liệu update
        const updateData = {
            email: email || doctor.email,
            full_name: full_name || doctor.full_name,
            phone: phone || doctor.phone,
            gender: gender || doctor.gender,
            specialty_id: specialty_id !== undefined ? specialty_id : doctor.specialty_id,
            experience: experience !== undefined ? experience : doctor.experience,
            education: education !== undefined ? education : doctor.education,
            description: description !== undefined ? description : doctor.description,
            is_active: is_active !== undefined ? is_active : doctor.is_active,
            updated_at: new Date()
        };

        // Nếu có password mới, hash và cập nhật
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Cập nhật
        await doctor.update(updateData);

        // Lấy lại thông tin bác sĩ với specialty
        const updatedDoctor = await Doctor.findByPk(id, {
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            attributes: { exclude: ['password', 'recovery_token'] }
        });

        console.log('✅ Doctor updated:', id);

        res.json({
            message: 'Cập nhật thông tin bác sĩ thành công',
            doctor: updatedDoctor
        });
    } catch (error) {
        console.error('❌ Error updating doctor:', error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật thông tin bác sĩ',
            error: error.message
        });
    }
};

// DELETE - Xóa bác sĩ
exports.deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🗑️ DELETE /api/admin/doctors/${id}`);

        const doctor = await Doctor.findByPk(id);
        if (!doctor) {
            return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
        }

        // Xóa bác sĩ
        await doctor.destroy();

        console.log('✅ Doctor deleted:', id);

        res.json({
            message: 'Xóa bác sĩ thành công'
        });
    } catch (error) {
        console.error('❌ Error deleting doctor:', error);
        res.status(500).json({
            message: 'Lỗi khi xóa bác sĩ',
            error: error.message
        });
    }
};

// PUT - Toggle trạng thái active/inactive
exports.toggleDoctorStatus = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🔄 PUT /api/admin/doctors/${id}/toggle-status`);

        const doctor = await Doctor.findByPk(id);
        if (!doctor) {
            return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
        }

        // Toggle is_active
        await doctor.update({
            is_active: !doctor.is_active,
            updated_at: new Date()
        });

        console.log('✅ Doctor status toggled:', id, '→', doctor.is_active);

        res.json({
            message: `${doctor.is_active ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản bác sĩ thành công`,
            is_active: doctor.is_active
        });
    } catch (error) {
        console.error('❌ Error toggling doctor status:', error);
        res.status(500).json({
            message: 'Lỗi khi thay đổi trạng thái bác sĩ',
            error: error.message
        });
    }
};

// DELETE - Cleanup test doctor by email (for API testing)
exports.cleanupDoctor = async (req, res) => {
    try {
        const { email } = req.query;

        console.log(`🧹 DELETE /api/admin/doctors/cleanup - email: ${email}`);

        if (!email) {
            return res.status(400).json({ message: 'Email là bắt buộc' });
        }

        const doctor = await Doctor.findOne({ where: { email } });

        if (!doctor) {
            return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
        }

        // Xóa lịch làm việc của bác sĩ trước
        await DoctorSchedule.destroy({ where: { doctor_id: doctor.id } });

        // Xóa bác sĩ
        await doctor.destroy();

        console.log('✅ Test doctor cleaned up:', email);

        res.json({
            message: 'Xóa bác sĩ test thành công',
            deleted_email: email
        });
    } catch (error) {
        console.error('❌ Error cleaning up doctor:', error);
        res.status(500).json({
            message: 'Lỗi khi xóa bác sĩ test',
            error: error.message
        });
    }
};
