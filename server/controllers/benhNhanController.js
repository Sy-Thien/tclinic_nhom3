const BenhNhan = require('../models/BenhNhan');

exports.layDanhSach = async (req, res) => {
    try {
        const ds = await BenhNhan.findAll();
        res.json(ds);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.them = async (req, res) => {
    try {
        const p = await BenhNhan.create(req.body);
        res.status(201).json(p);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};