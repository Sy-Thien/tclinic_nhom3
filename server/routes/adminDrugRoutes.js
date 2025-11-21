const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const adminDrugController = require('../controllers/adminDrugController');

// Middleware: Kiểm tra role admin
const checkAdminRole = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền truy cập' });
    }
    next();
};

// GET - Danh sách tất cả thuốc
router.get('/drugs', verifyToken, checkAdminRole, adminDrugController.getAllDrugs);

// GET - Chi tiết thuốc
router.get('/drugs/:id', verifyToken, checkAdminRole, adminDrugController.getDrugById);

// POST - Thêm thuốc mới
router.post('/drugs', verifyToken, checkAdminRole, adminDrugController.createDrug);

// PUT - Cập nhật thuốc
router.put('/drugs/:id', verifyToken, checkAdminRole, adminDrugController.updateDrug);

// DELETE - Xóa thuốc
router.delete('/drugs/:id', verifyToken, checkAdminRole, adminDrugController.deleteDrug);

// GET - Cảnh báo tồn kho
router.get('/drugs/stock/warnings', verifyToken, checkAdminRole, adminDrugController.getStockWarnings);

// PUT - Cập nhật tồn kho
router.put('/drugs/:id/stock', verifyToken, checkAdminRole, adminDrugController.updateStock);

module.exports = router;
