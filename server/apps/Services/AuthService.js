const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin, Patient, Doctor } = require('../Database/Entity');

class AuthService {
    /**
     * Đăng nhập - kiểm tra 3 bảng: Admin, Doctor, Patient
     * @param {string} identifier - Email hoặc username
     * @param {string} password 
     */
    async login(identifier, password) {
        // 1. Check Admin first (by username)
        let user = await Admin.findOne({ where: { username: identifier } });
        let role = 'admin';

        // 2. Check Doctor (by email)
        if (!user) {
            user = await Doctor.findOne({ where: { email: identifier } });
            role = 'doctor';
        }

        // 3. Check Patient (by email)
        if (!user) {
            user = await Patient.findOne({ where: { email: identifier } });
            role = 'patient';
        }

        if (!user) {
            return { success: false, message: 'Tài khoản không tồn tại' };
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return { success: false, message: 'Mật khẩu không đúng' };
        }

        // Check if account is active
        if (user.is_active === false) {
            return { success: false, message: 'Tài khoản đã bị khóa' };
        }

        // Generate JWT token
        const tokenPayload = {
            id: user.id,
            email: user.email || user.username,
            role: role
        };

        if (role === 'doctor') {
            tokenPayload.doctor_id = user.id;
        }

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        return {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email || user.username,
                full_name: user.full_name || user.username,
                role: role,
                avatar: user.avatar
            }
        };
    }

    /**
     * Đăng ký patient mới
     * @param {Object} data 
     */
    async register(data) {
        const { email, password, full_name, phone, gender, date_of_birth, address } = data;

        // Check if email exists
        const existing = await Patient.findOne({ where: { email } });
        if (existing) {
            return { success: false, message: 'Email đã được sử dụng' };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create patient
        const patient = await Patient.create({
            email,
            password: hashedPassword,
            full_name,
            phone,
            gender,
            date_of_birth,
            address,
            is_active: true
        });

        return {
            success: true,
            message: 'Đăng ký thành công',
            user: {
                id: patient.id,
                email: patient.email,
                full_name: patient.full_name
            }
        };
    }

    /**
     * Đổi mật khẩu
     * @param {number} userId 
     * @param {string} role 
     * @param {string} oldPassword 
     * @param {string} newPassword 
     */
    async changePassword(userId, role, oldPassword, newPassword) {
        let Model;
        switch (role) {
            case 'admin': Model = Admin; break;
            case 'doctor': Model = Doctor; break;
            case 'patient': Model = Patient; break;
            default: return { success: false, message: 'Role không hợp lệ' };
        }

        const user = await Model.findByPk(userId);
        if (!user) {
            return { success: false, message: 'Không tìm thấy tài khoản' };
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return { success: false, message: 'Mật khẩu cũ không đúng' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        return { success: true, message: 'Đổi mật khẩu thành công' };
    }

    /**
     * Verify JWT token
     * @param {string} token 
     */
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            return { success: true, data: decoded };
        } catch (error) {
            return { success: false, message: 'Token không hợp lệ hoặc đã hết hạn' };
        }
    }
}

module.exports = new AuthService();
