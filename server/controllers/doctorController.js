const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');

exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.findAll();
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách bác sĩ', error: error.message });
    }
};

exports.addDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.create(req.body);
        res.status(201).json(doctor);
    } catch (error) {
        res.status(400).json({ message: 'Lỗi khi thêm bác sĩ', error: error.message });
    }
};

module.exports = router;