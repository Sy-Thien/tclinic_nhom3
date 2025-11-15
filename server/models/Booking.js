const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'patient_id'
    },
    service_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'service_id'
    },
    appointment_date: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'appointment_date'
    },
    appointment_hour: {
        type: DataTypes.STRING(5),
        allowNull: false,
        field: 'appointment_hour'
    },
    status: {
        type: DataTypes.STRING(15),
        defaultValue: 'pending',
        field: 'status'
    },
    create_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'create_at'
    },
    update_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'update_at'
    }
}, {
    tableName: 'tn_booking',
    timestamps: false
});

module.exports = Booking;