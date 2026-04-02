const express = require('express');
const router = express.Router();
const adminTimeSlotController = require('../../controllers/adminTimeSlotController');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

// Tất cả routes yêu cầu admin
router.use(verifyToken, isAdmin);

// GET /api/admin/time-slots - Lấy danh sách time slots
router.get('/', adminTimeSlotController.getTimeSlots);

// GET /api/admin/time-slots/stats - Lấy thống kê
router.get('/stats', adminTimeSlotController.getTimeSlotStats);

// GET /api/admin/time-slots/:id - Lấy chi tiết 1 time slot
router.get('/:id', adminTimeSlotController.getTimeSlotById);

// POST /api/admin/time-slots - Tạo time slot mới
router.post('/', adminTimeSlotController.createTimeSlot);

// POST /api/admin/time-slots/bulk - Tạo nhiều time slots
router.post('/bulk', adminTimeSlotController.bulkCreateTimeSlots);

// POST /api/admin/time-slots/generate - Tạo time slots tự động theo lịch làm việc
router.post('/generate', adminTimeSlotController.generateTimeSlots);

// PUT /api/admin/time-slots/:id - Cập nhật time slot
router.put('/:id', adminTimeSlotController.updateTimeSlot);

// PATCH /api/admin/time-slots/:id/toggle - Toggle available
router.patch('/:id/toggle', adminTimeSlotController.toggleAvailable);

// DELETE /api/admin/time-slots/bulk - Xóa nhiều time slots
router.delete('/bulk', adminTimeSlotController.bulkDeleteTimeSlots);

// DELETE /api/admin/time-slots/:id - Xóa time slot
router.delete('/:id', adminTimeSlotController.deleteTimeSlot);

module.exports = router;


