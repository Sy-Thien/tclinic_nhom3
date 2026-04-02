const express = require('express');
const router = express.Router();
const publicController = require('../../controllers/publicController');

// Home page APIs
router.get('/home-stats', publicController.getHomeStats);
router.get('/featured-doctors', publicController.getFeaturedDoctors);
router.get('/testimonials', publicController.getTestimonials);
router.get('/popular-specialties', publicController.getPopularSpecialties);
router.get('/specialties-with-doctors', publicController.getSpecialtiesWithDoctors);

// Danh sách chuyên khoa
router.get('/specialties', publicController.getSpecialties);

// Danh sách dịch vụ
router.get('/services', publicController.getServices);

// Chi tiết dịch vụ
router.get('/services/:id', publicController.getServiceDetail);

// Đặt lịch khám
router.post('/booking', publicController.createBooking);

// Danh sách bác sĩ
router.get('/doctors', publicController.getDoctors);

// Chi tiết bác sĩ
router.get('/doctors/:id', publicController.getDoctorDetail);

// Lịch làm việc của bác sĩ
router.get('/doctors/:id/schedule', publicController.getDoctorSchedule);

// Danh sách thuốc
router.get('/drugs', publicController.getDrugs);

module.exports = router;


