const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    booking_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_booking',
            key: 'id'
        }
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_doctors',
            key: 'id'
        }
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_patients',
            key: 'id'
        }
    },
    numerical_order: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    appointment_time: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(15),
        allowNull: true,
        defaultValue: 'waiting'
    },
    create_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    update_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tn_appointments',
    timestamps: false
});

module.exports = Appointment;