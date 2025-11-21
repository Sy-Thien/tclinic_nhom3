const { Doctor } = require('../models');
const bcrypt = require('bcrypt');

// ✅ GET - Lấy thông tin bác sĩ
exports.getDoctorProfile = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        console.log(`📋 GET /api/doctor/profile/${doctor_id}`);

        const doctor = await Doctor.findByPk(doctor_id, {
            attributes: { exclude: ['password'] }
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin bác sĩ'
            });
        }

        console.log(`✅ Found doctor: ${doctor.full_name}`);
        res.json({
            success: true,
            data: doctor
        });
    } catch (error) {
        console.error('❌ Error fetching doctor profile:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ PUT - Cập nhật thông tin bác sĩ
exports.updateDoctorProfile = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const { full_name, phone, email, address, experience, bio, degree } = req.body;
        console.log(`📝 PUT /api/doctor/profile/${doctor_id}`, { full_name, phone, email });

        const doctor = await Doctor.findByPk(doctor_id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin bác sĩ'
            });
        }

        // Validate email uniqueness nếu email thay đổi
        if (email && email !== doctor.email) {
            const existingDoctor = await Doctor.findOne({
                where: { email }
            });
            if (existingDoctor) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng'
                });
            }
        }

        // Update thông tin
        await doctor.update({
            full_name: full_name !== undefined ? full_name : doctor.full_name,
            phone: phone !== undefined ? phone : doctor.phone,
            email: email !== undefined ? email : doctor.email,
            address: address !== undefined ? address : doctor.address,
            experience: experience !== undefined ? experience : doctor.experience,
            bio: bio !== undefined ? bio : doctor.bio,
            degree: degree !== undefined ? degree : doctor.degree,
            updated_at: new Date()
        });

        console.log(`✅ Doctor profile updated: ${doctor.full_name}`);

        // Return profile without password
        const updatedDoctor = await Doctor.findByPk(doctor_id, {
            attributes: { exclude: ['password'] }
        });

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: updatedDoctor
        });
    } catch (error) {
        console.error('❌ Error updating doctor profile:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ PUT - Đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;
        console.log(`🔐 PUT /api/doctor/change-password/${doctor_id}`);

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu xác nhận không khớp'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        const doctor = await Doctor.findByPk(doctor_id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin bác sĩ'
            });
        }

        // Kiểm tra mật khẩu hiện tại
        const isPasswordValid = await bcrypt.compare(currentPassword, doctor.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update mật khẩu
        await doctor.update({
            password: hashedPassword,
            updated_at: new Date()
        });

        console.log(`✅ Password changed for doctor: ${doctor.full_name}`);

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });
    } catch (error) {
        console.error('❌ Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};
