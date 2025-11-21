const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PrescriptionDetail = sequelize.define('PrescriptionDetail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    prescription_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_prescriptions',
            key: 'id'
        }
    },
    drug_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_drugs',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    unit: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'viên'
    },
    dosage: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Liều dùng: sáng, trưa, tối'
    },
    duration: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Thời gian sử dụng: 7 ngày'
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Hướng dẫn: Uống trước hay sau ăn, ...'
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tn_prescription_details',
    timestamps: false
});

module.exports = PrescriptionDetail;
