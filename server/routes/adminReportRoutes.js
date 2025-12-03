const express = require('express');
const router = express.Router();
const adminReportController = require('../controllers/adminReportController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, isAdmin);

router.get('/reports/visits', adminReportController.getVisitStats);
router.get('/reports/top-doctors', adminReportController.getTopDoctors);
router.get('/reports/popular-specialties', adminReportController.getPopularSpecialties);
router.get('/reports/summary', adminReportController.getSummaryStats);
router.get('/reports/revenue', adminReportController.getRevenueStats);  // ✅ NEW: Thống kê doanh thu
router.get('/reports/export-excel', adminReportController.exportExcel);
router.get('/reports/export-pdf', adminReportController.exportPDF);

module.exports = router;
