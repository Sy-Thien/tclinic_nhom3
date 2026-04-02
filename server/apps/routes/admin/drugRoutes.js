const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth');
const adminDrugController = require('../../controllers/adminDrugController');

// Middleware: Kiểm tra role admin
const checkAdminRole = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền truy cập' });
    }
    next();
};

// GET - Danh sách tất cả thuốc
router.get('/', verifyToken, checkAdminRole, adminDrugController.getAllDrugs);

// GET - Cảnh báo tồn kho (MUST be before /:id)
router.get('/stock/warnings', verifyToken, checkAdminRole, adminDrugController.getStockWarnings);

// GET - Chi tiết thuốc
router.get('/:id', verifyToken, checkAdminRole, adminDrugController.getDrugById);

// POST - Thêm thuốc mới
router.post('/', verifyToken, checkAdminRole, adminDrugController.createDrug);

// PUT - Cập nhật thuốc
router.put('/:id', verifyToken, checkAdminRole, adminDrugController.updateDrug);

// DELETE - Xóa thuốc
router.delete('/:id', verifyToken, checkAdminRole, adminDrugController.deleteDrug);

// PUT - Cập nhật tồn kho
router.put('/:id/stock', verifyToken, checkAdminRole, adminDrugController.updateStock);

module.exports = router;


