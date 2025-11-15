const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Doctor = require('../models/Doctor'); // hoặc model User nếu bạn có

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