const express = require('express');
const router = express.Router();
const adminReportController = require('../../controllers/adminReportController');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

router.use(verifyToken, isAdmin);

router.get('/visits', adminReportController.getVisitStats);
router.get('/top-doctors', adminReportController.getTopDoctors);
router.get('/popular-specialties', adminReportController.getPopularSpecialties);
router.get('/summary', adminReportController.getSummaryStats);
router.get('/revenue', adminReportController.getRevenueStats);
router.get('/export-excel', adminReportController.exportExcel);
router.get('/export-pdf', adminReportController.exportPDF);

module.exports = router;


