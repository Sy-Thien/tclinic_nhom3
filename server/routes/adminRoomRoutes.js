const express = require('express');
const router = express.Router();
const adminRoomController = require('../controllers/adminRoomController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Tất cả route yêu cầu admin auth
router.use(verifyToken, isAdmin);

// GET - Danh sách phòng khám
router.get('/rooms', adminRoomController.getAllRooms);

// GET - Danh sách tầng
router.get('/rooms/floors', adminRoomController.getFloors);

// GET - Thống kê phòng khám
router.get('/rooms/stats', adminRoomController.getRoomStats);

// GET - Thông tin chi tiết phòng khám
router.get('/rooms/:id', adminRoomController.getRoomById);

// POST - Thêm phòng khám mới
router.post('/rooms', adminRoomController.createRoom);

// PUT - Cập nhật thông tin phòng khám
router.put('/rooms/:id', adminRoomController.updateRoom);

// DELETE - Xóa phòng khám
router.delete('/rooms/:id', adminRoomController.deleteRoom);

module.exports = router;
