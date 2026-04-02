const express = require('express');
const router = express.Router();
const adminRoomController = require('../../controllers/adminRoomController');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

// Tất cả route yêu cầu admin auth
router.use(verifyToken, isAdmin);

// GET - Danh sách phòng khám
router.get('/', adminRoomController.getAllRooms);

// GET - Danh sách tầng
router.get('/floors', adminRoomController.getFloors);

// GET - Thống kê phòng khám
router.get('/stats', adminRoomController.getRoomStats);

// GET - Thông tin chi tiết phòng khám
router.get('/:id', adminRoomController.getRoomById);

// POST - Thêm phòng khám mới
router.post('/', adminRoomController.createRoom);

// PUT - Cập nhật thông tin phòng khám
router.put('/:id', adminRoomController.updateRoom);

// DELETE - Xóa phòng khám
router.delete('/:id', adminRoomController.deleteRoom);

module.exports = router;


