const { Patient } = require('../models');
const bcrypt = require('bcryptjs');

// ✅ GET - Lấy thông tin khách hàng
exports.getPatientProfile = async (req, res) => {
    try {
        const patient_id = req.user.id;
        console.log(`📋 GET /api/patient/profile/${patient_id}`);

        const patient = await Patient.findByPk(patient_id, {
            attributes: { exclude: ['password'] }
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin khách hàng'
            });
        }

        console.log(`✅ Found patient: ${patient.full_name}`);
        res.json({
            success: true,
            data: patient
        });
    } catch (error) {
        console.error('❌ Error fetching patient profile:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ PUT - Cập nhật thông tin khách hàng
exports.updatePatientProfile = async (req, res) => {
    try {
        const patient_id = req.user.id;
        const { full_name, phone, email, gender, birthday, address } = req.body;
        console.log(`📝 PUT /api/patient/profile/${patient_id}`, { full_name, phone, email });

        const patient = await Patient.findByPk(patient_id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin khách hàng'
            });
        }

        // Validate email uniqueness nếu email thay đổi
        if (email && email !== patient.email) {
            const existingPatient = await Patient.findOne({
                where: { email }
            });
            if (existingPatient) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng'
                });
            }
        }

        // Update thông tin
        await patient.update({
            full_name: full_name !== undefined ? full_name : patient.full_name,
            phone: phone !== undefined ? phone : patient.phone,
            email: email !== undefined ? email : patient.email,
            gender: gender !== undefined ? gender : patient.gender,
            birthday: birthday !== undefined ? birthday : patient.birthday,
            address: address !== undefined ? address : patient.address,
            updated_at: new Date()
        });

        console.log(`✅ Patient profile updated: ${patient.full_name}`);

        // Return profile without password
        const updatedPatient = await Patient.findByPk(patient_id, {
            attributes: { exclude: ['password'] }
        });

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: updatedPatient
        });
    } catch (error) {
        console.error('❌ Error updating patient profile:', error);
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
        const patient_id = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;
        console.log(`🔐 PUT /api/patient/change-password/${patient_id}`);

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

        const patient = await Patient.findByPk(patient_id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin khách hàng'
            });
        }

        // Kiểm tra mật khẩu hiện tại
        const isPasswordValid = await bcrypt.compare(currentPassword, patient.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update mật khẩu
        await patient.update({
            password: hashedPassword,
            updated_at: new Date()
        });

        console.log(`✅ Password changed for patient: ${patient.full_name}`);

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
