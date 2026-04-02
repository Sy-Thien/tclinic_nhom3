const bcrypt = require('bcryptjs');
const Doctor = require('../Database/Entity');

class DoctorController {
    async getAllDoctors(req, res) {
        try {
            const doctors = await Doctor.findAll();
            res.json(doctors);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi lấy danh sách bác sĩ', error: error.message });
        }
    };

    async addDoctor(req, res) {
        try {
            const { password, ...otherData } = req.body;

            // Hash password nếu có
            let hashedPassword = null;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
            }

            const doctor = await Doctor.create({
                ...otherData,
                password: hashedPassword
            });
            res.status(201).json(doctor);
        } catch (error) {
            res.status(400).json({ message: 'Lỗi khi thêm bác sĩ', error: error.message });
        }
    };
}

module.exports = new DoctorController();



