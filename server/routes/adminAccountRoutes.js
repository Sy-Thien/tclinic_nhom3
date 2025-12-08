const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const adminAccountController = require('../controllers/adminAccountController');

// All routes require admin role
router.use(verifyToken, isAdmin);

// Get all admin accounts
router.get('/admins', adminAccountController.getAdmins);

// Get all doctors with password status
router.get('/doctors', adminAccountController.getDoctors);

// Get all patients with password status
router.get('/patients', adminAccountController.getPatients);

// Reset password for any account
router.post('/reset-password', adminAccountController.resetPassword);

// Create new admin account
router.post('/admins', adminAccountController.createAdmin);

module.exports = router;
