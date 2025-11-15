const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    console.log('🔐 Verifying token:', token ? 'Present' : 'Missing');

    if (!token) {
        return res.status(401).json({
            valid: false,
            message: 'Token không tồn tại'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        console.log('✅ Token valid:', decoded);

        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ Token invalid:', error.message);

        return res.status(401).json({
            valid: false,
            message: 'Token không hợp lệ hoặc đã hết hạn'
        });
    }
};

module.exports = { verifyToken };