const express = require('express');
const router = express.Router();
const adminConsultationController = require('../controllers/adminConsultationController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Tất cả routes yêu cầu admin role
router.use(verifyToken, isAdmin);

// Statistics
router.get('/stats', adminConsultationController.getStats);

// CRUD operations
router.get('/', adminConsultationController.getAllRequests);
router.post('/:id/assign-doctor', adminConsultationController.assignDoctor);
router.put('/:id', adminConsultationController.updateRequest);
router.delete('/:id', adminConsultationController.deleteRequest);

module.exports = router;
