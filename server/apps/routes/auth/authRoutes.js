const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const { verifyToken } = require('../../middlewares/auth');

// POST - Register (CHỈ CHO PATIENT)
router.post('/register', authController.register);

// POST - Login (ADMIN, DOCTOR, PATIENT)
router.post('/login', authController.login);

// GET - Verify token
router.get('/verify', verifyToken, authController.verifyToken);

// GET - Verify session (kiểm tra single session)
router.get('/verify-session', verifyToken, authController.verifySession);

// POST - Logout (xóa session_token)
router.post('/logout', verifyToken, authController.logout);

// POST - Change Password (for all roles)
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
