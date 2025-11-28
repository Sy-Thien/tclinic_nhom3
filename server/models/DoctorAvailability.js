const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DoctorAvailability = sequelize.define('DoctorAvailability', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_doctors',
            key: 'id'
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Ngày khám (YYYY-MM-DD)'
    },
    time_slot: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Khung giờ: 08:00-08:30, 09:00-09:30, etc.'
    },
    is_booked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Đã được đặt hay chưa'
    },
    booking_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tn_bookings',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('available', 'booked', 'blocked'),
        defaultValue: 'available',
        comment: 'available: Còn trống, booked: Đã đặt, blocked: Admin khóa'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tn_doctor_availability',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['doctor_id', 'date', 'time_slot']
        }
    ]
});

module.exports = DoctorAvailability;
