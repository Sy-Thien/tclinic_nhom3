const express = require('express');
const router = express.Router();
const Doctor = require('../../models/Doctor');
const { verifyToken, isAdmin } = require('../../middleware/authMiddleware');

router.use(verifyToken, isAdmin);

router.get('/', async (req, res) => {
    const ds = await Doctor.findAll();
    res.json(ds);
});

router.post('/', async (req, res) => {
    const d = await Doctor.create(req.body);
    res.status(201).json(d);
});

module.exports = router;