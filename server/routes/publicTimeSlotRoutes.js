const express = require('express');
const router = express.Router();
const publicTimeSlotController = require('../controllers/publicTimeSlotController');

// GET - Lấy danh sách khung giờ khả dụng
router.get('/available-time-slots', publicTimeSlotController.getAvailableTimeSlots);

// GET - Lấy lịch khám theo ngày (calendar view)
router.get('/booking-calendar', publicTimeSlotController.getBookingCalendar);

module.exports = router;
