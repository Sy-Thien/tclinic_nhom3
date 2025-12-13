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

// Middleware kiểm tra role admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
    }
};

// Middleware kiểm tra role doctor
const isDoctor = (req, res, next) => {
    if (req.user && req.user.role === 'doctor') {
        next();
    } else {
        return res.status(403).json({ message: 'Chỉ bác sĩ mới có quyền truy cập' });
    }
};

// Middleware kiểm tra role patient
const isPatient = (req, res, next) => {
    if (req.user && req.user.role === 'patient') {
        next();
    } else {
        return res.status(403).json({ message: 'Chỉ bệnh nhân mới có quyền truy cập' });
    }
};

// ✅ NEW: Optional auth - đọc token nếu có, không bắt buộc
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            req.user = decoded;
            console.log('🔐 Optional auth: User identified as', decoded.role);
        } catch (error) {
            // Token không hợp lệ - tiếp tục như guest
            console.log('⚠️ Optional auth: Invalid token, continuing as guest');
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
};

// Aliases for compatibility
const checkDoctorRole = isDoctor;
const checkAdminRole = isAdmin;

module.exports = { verifyToken, isAdmin, isDoctor, isPatient, checkDoctorRole, checkAdminRole, optionalAuth };