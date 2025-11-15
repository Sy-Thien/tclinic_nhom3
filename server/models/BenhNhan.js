const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');

const BenhNhan = sequelize.define('BenhNhan', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    hoTen: { type: DataTypes.STRING, allowNull: false },
    ngaySinh: DataTypes.DATEONLY,
    gioiTinh: DataTypes.ENUM('Nam', 'Nữ', 'Khác'),
    soDienThoai: DataTypes.STRING,
    diaChi: DataTypes.STRING
}, {
    tableName: 'tn_patients',
    timestamps: true,
    createdAt: 'create_at',
    updatedAt: 'update_at'
});

module.exports = BenhNhan;

exports.verifyToken = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
    const token = auth.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') return next();
    return res.status(403).json({ message: 'Access denied' });
};

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