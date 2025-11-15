const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/benhNhanController');

router.get('/', ctrl.layDanhSach);
router.post('/', ctrl.them);

module.exports = router;