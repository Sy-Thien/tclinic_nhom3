const express = require('express');
const router = express.Router();
const doctorConsultationController = require('../controllers/doctorConsultationController');
const { verifyToken, isDoctor } = require('../middleware/authMiddleware');

// Tất cả routes yêu cầu doctor role
router.use(verifyToken, isDoctor);

router.get('/', doctorConsultationController.getMyAssignedRequests);
router.get('/:id', doctorConsultationController.getRequestDetail);
router.post('/:id/respond', doctorConsultationController.respondToRequest);
router.put('/:id/resolve', doctorConsultationController.markAsResolved);

module.exports = router;
