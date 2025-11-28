const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Doctor = require('../../models/Doctor');
const { verifyToken, isAdmin } = require('../../middleware/authMiddleware');

router.use(verifyToken, isAdmin);

router.get('/', async (req, res) => {
    const ds = await Doctor.findAll();
    res.json(ds);
});

router.post('/', async (req, res) => {
    try {
        const { password, ...otherData } = req.body;

        // Hash password nếu có
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const d = await Doctor.create({
            ...otherData,
            password: hashedPassword
        });
        res.status(201).json(d);
    } catch (error) {
        console.error('Error creating doctor:', error);
        res.status(500).json({ message: 'Lỗi khi tạo bác sĩ', error: error.message });
    }
});

module.exports = router;