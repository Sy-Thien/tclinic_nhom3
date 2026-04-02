const express = require('express');
const router = express.Router();
const reviewController = require('../../controllers/reviewController');
const { verifyToken } = require('../../middlewares/auth');

// Middleware kiểm tra role patient
const checkPatientRole = (req, res, next) => {
    if (req.user.role !== 'patient') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ bệnh nhân mới có quyền đánh giá'
        });
    }
    next();
};

// Public routes
router.get('/doctor/:doctor_id', reviewController.getDoctorReviews);

// Protected routes - Patient only
router.post('/create', verifyToken, checkPatientRole, reviewController.createReview);
router.get('/my-reviews', verifyToken, checkPatientRole, reviewController.getMyReviews);
router.put('/:id', verifyToken, checkPatientRole, reviewController.updateReview);
router.delete('/:id', verifyToken, checkPatientRole, reviewController.deleteReview);
router.get('/check-eligibility/:booking_id', verifyToken, checkPatientRole, reviewController.checkReviewEligibility);

module.exports = router;



