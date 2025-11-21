const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Drug = sequelize.define('Drug', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    ingredient: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    unit: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'viên'
    },
    expiry_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    warning_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        comment: 'Cảnh báo khi tồn kho dưới mức này'
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
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
    tableName: 'tn_drugs',
    timestamps: false
});

module.exports = Drug;