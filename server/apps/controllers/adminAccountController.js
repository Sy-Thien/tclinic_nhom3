const { Admin, Doctor, Patient, Specialty } = require('../Database/Entity');
const bcrypt = require('bcrypt');

// Get all admin accounts

class AdminAccountController {
        async getAdmins(req, res) {
        try {
            const admins = await Admin.findAll({
                attributes: ['id', 'username', 'full_name', 'email', 'password', 'created_at'],
                order: [['id', 'ASC']]
            });

            // Check if each admin still has default password
            const adminsWithPasswordStatus = await Promise.all(
                admins.map(async (admin) => {
                    let isDefaultPassword = false;
                    if (admin.password) {
                        try {
                            isDefaultPassword = await bcrypt.compare('123456', admin.password);
                        } catch (err) {
                            console.error('Error comparing password for admin', admin.id, ':', err.message);
                        }
                    }
                    return {
                        id: admin.id,
                        username: admin.username,
                        full_name: admin.full_name,
                        email: admin.email,
                        created_at: admin.created_at,
                        has_default_password: isDefaultPassword
                    };
                })
            );

            res.json(adminsWithPasswordStatus);
        } catch (error) {
            console.error('Error fetching admins:', error);
            res.status(500).json({ message: 'Lỗi khi tải danh sách admin', error: error.message });
        }
    };

    // Reset password for any account type
        async resetPassword(req, res) {
        try {
            const { accountType, accountId, newPassword } = req.body;

            if (!accountType || !accountId || !newPassword) {
                return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Determine which model to use
            let Model;
            switch (accountType) {
                case 'admins':
                    Model = Admin;
                    break;
                case 'doctors':
                    Model = Doctor;
                    break;
                case 'patients':
                    Model = Patient;
                    break;
                default:
                    return res.status(400).json({ message: 'Loại tài khoản không hợp lệ' });
            }

            // Update password
            const [updated] = await Model.update(
                { password: hashedPassword },
                { where: { id: accountId } }
            );

            if (updated === 0) {
                return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
            }

            res.json({ message: 'Reset mật khẩu thành công' });
        } catch (error) {
            console.error('Error resetting password:', error);
            res.status(500).json({ message: 'Lỗi khi reset mật khẩu', error: error.message });
        }
    };

    // Create new admin account
        async createAdmin(req, res) {
        try {
            const { username, password, full_name, email } = req.body;

            // Check if username exists
            const existingAdmin = await Admin.findOne({ where: { username } });
            if (existingAdmin) {
                return res.status(400).json({ message: 'Username đã tồn tại' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create admin
            const admin = await Admin.create({
                username,
                password: hashedPassword,
                full_name,
                email
            });

            res.status(201).json({
                message: 'Tạo tài khoản admin thành công',
                admin: {
                    id: admin.id,
                    username: admin.username,
                    full_name: admin.full_name,
                    email: admin.email
                }
            });
        } catch (error) {
            console.error('Error creating admin:', error);
            res.status(500).json({ message: 'Lỗi khi tạo tài khoản admin', error: error.message });
        }
    };

    // Get all doctors with password status
        async getDoctors(req, res) {
        try {
            const doctors = await Doctor.findAll({
                attributes: ['id', 'full_name', 'email', 'phone', 'password', 'specialty_id', 'created_at'],
                include: [{
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['name']
                }],
                order: [['id', 'ASC']]
            });

            // Check if each doctor still has default password
            const doctorsWithPasswordStatus = await Promise.all(
                doctors.map(async (doctor) => {
                    let isDefaultPassword = false;
                    if (doctor.password) {
                        try {
                            isDefaultPassword = await bcrypt.compare('123456', doctor.password);
                        } catch (err) {
                            console.error('Error comparing password for doctor', doctor.id, ':', err.message);
                        }
                    }
                    return {
                        id: doctor.id,
                        full_name: doctor.full_name,
                        email: doctor.email,
                        phone: doctor.phone,
                        Specialty: doctor.specialty, // Use lowercase 'specialty' alias
                        specialty_id: doctor.specialty_id,
                        created_at: doctor.created_at,
                        has_default_password: isDefaultPassword
                    };
                })
            );

            res.json(doctorsWithPasswordStatus);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            res.status(500).json({ message: 'Lỗi khi tải danh sách bác sĩ', error: error.message });
        }
    };

    // Get all patients with password status
        async getPatients(req, res) {
        try {
            const patients = await Patient.findAll({
                attributes: ['id', 'full_name', 'email', 'phone', 'password', 'created_at'],
                order: [['id', 'ASC']]
            });

            // Check if each patient still has default password
            const patientsWithPasswordStatus = await Promise.all(
                patients.map(async (patient) => {
                    let isDefaultPassword = false;
                    if (patient.password) {
                        try {
                            isDefaultPassword = await bcrypt.compare('123456', patient.password);
                        } catch (err) {
                            console.error('Error comparing password for patient', patient.id, ':', err.message);
                        }
                    }
                    return {
                        id: patient.id,
                        full_name: patient.full_name,
                        email: patient.email,
                        phone_number: patient.phone, // Map 'phone' to 'phone_number' for frontend
                        created_at: patient.created_at,
                        has_default_password: isDefaultPassword
                    };
                })
            );

            res.json(patientsWithPasswordStatus);
        } catch (error) {
            console.error('Error fetching patients:', error);
            res.status(500).json({ message: 'Lỗi khi tải danh sách bệnh nhân', error: error.message });
        }
    };

}

module.exports = new AdminAccountController();



