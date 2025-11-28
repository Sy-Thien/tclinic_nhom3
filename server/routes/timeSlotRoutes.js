const express = require('express');
const router = express.Router();
const timeSlotController = require('../controllers/timeSlotController');
const { verifyToken, isAdmin, isDoctor } = require('../middleware/authMiddleware');

// ADMIN ROUTES
router.post(
    '/admin/time-slots',
    verifyToken,
    isAdmin,
    timeSlotController.createTimeSlot
);

router.post(
    '/admin/time-slots/multiple',
    verifyToken,
    isAdmin,
    timeSlotController.createMultipleTimeSlots
);

router.get(
    '/admin/time-slots',
    verifyToken,
    isAdmin,
    timeSlotController.getTimeSlots
);

router.put(
    '/admin/time-slots/:id',
    verifyToken,
    isAdmin,
    timeSlotController.updateTimeSlot
);

router.delete(
    '/admin/time-slots/:id',
    verifyToken,
    isAdmin,
    timeSlotController.deleteTimeSlot
);

// PUBLIC/USER ROUTES - Lấy time slots có sẵn để đặt lịch
router.get(
    '/time-slots/available',
    timeSlotController.getAvailableTimeSlots
);

// DOCTOR ROUTES - Xem lịch làm việc của mình
router.get(
    '/doctor/time-slots',
    verifyToken,
    isDoctor,
    timeSlotController.getDoctorTimeSlots
);

module.exports = router;
