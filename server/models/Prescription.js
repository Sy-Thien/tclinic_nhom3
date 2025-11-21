const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prescription = sequelize.define('Prescription', {
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
        allowNull: true,
        references: {
            model: 'tn_patients',
            key: 'id'
        }
    },
    prescription_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Hướng dẫn sử dụng'
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tn_prescriptions',
    timestamps: false
});

module.exports = Prescription;
