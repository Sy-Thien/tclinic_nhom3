const express = require('express');
const router = express.Router();
const bookingAvailabilityController = require('../../controllers/bookingAvailabilityController');

// Lấy danh sách bác sĩ theo chuyên khoa
router.get('/doctors-by-specialty', bookingAvailabilityController.getDoctorsBySpecialty);

// Lấy giờ rảnh của một bác sĩ cụ thể
router.get('/available-slots', bookingAvailabilityController.getAvailableSlots);

// Lấy danh sách bác sĩ rảnh trong một ngày
router.get('/available-doctors', bookingAvailabilityController.getAvailableDoctors);

module.exports = router;



