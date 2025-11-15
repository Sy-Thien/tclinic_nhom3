const express = require('express');
const db = require('../db');
const router = express.Router();

// Lấy khung giờ còn trống
const getAvailableSlots = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ngày!'
            });
        }

        // Tất cả khung giờ trong ngày
        const allSlots = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
            '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
        ];

        // Lấy các khung giờ đã đặt
        const [bookedSlots] = await db.query(
            `SELECT appointment_time, COUNT(*) as count 
             FROM tn_appointments 
             WHERE date = ? AND status != 'cancelled'
             GROUP BY appointment_time`,
            [date]
        );

        // Lọc ra các khung giờ còn trống (tối đa 5 lịch/khung)
        const availableSlots = allSlots.filter(slot => {
            const booked = bookedSlots.find(b => b.appointment_time === slot);
            return !booked || booked.count < 5;
        });

        res.json(availableSlots);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy khung giờ!'
        });
    }
};

module.exports = {
    getAvailableSlots
};