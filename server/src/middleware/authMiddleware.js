const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Không có token xác thực!'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token không hợp lệ!'
            });
        }
        req.user = user;
        next();
    });
};

// Middleware kiểm tra role admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập!'
        });
    }
    next();
};

// Middleware kiểm tra role doctor
const isDoctor = (req, res, next) => {
    if (req.user.role !== 'doctor') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ bác sĩ mới có quyền truy cập!'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    isAdmin,
    isDoctor
};