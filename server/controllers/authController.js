const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Admin, Doctor, Patient } = require('../models');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await Doctor.findOne({ where: { email } });
        if (!user) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
        const valid = await bcrypt.compare(password, user.password || '');
        if (!valid) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Change password for any authenticated user
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }

        // Determine which model to use based on role
        let Model;
        switch (userRole) {
            case 'admin':
                Model = Admin;
                break;
            case 'doctor':
                Model = Doctor;
                break;
            case 'patient':
                Model = Patient;
                break;
            default:
                return res.status(400).json({ message: 'Role không hợp lệ' });
        }

        // Find user
        const user = await Model.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await user.update({ password: hashedPassword });

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Lỗi khi đổi mật khẩu', error: error.message });
    }
};
