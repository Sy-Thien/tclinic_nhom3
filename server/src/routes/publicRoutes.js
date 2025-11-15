const {
    getSpecialties,
    getServices,
    getDoctors,
    getAvailableSlots  // ← THÊM
} = require('../controllers/publicController');

const router = express.Router();

// Lấy danh sách chuyên khoa
router.get('/public/specialties', getSpecialties);

// Lấy danh sách dịch vụ
router.get('/public/services', getServices);

// Lấy danh sách bác sĩ
router.get('/public/doctors', getDoctors);

// Lấy khung giờ trống
router.get('/public/available-slots', getAvailableSlots);

module.exports = router;