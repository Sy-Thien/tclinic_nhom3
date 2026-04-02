const { Model, DataTypes } = require('sequelize');
const sequelize = require('../DatabaseConnection');

class Drug extends Model { }

Drug.init({
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
    usage_guide: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Hướng dẫn sử dụng thuốc'
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Ghi chú về thuốc'
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
    sequelize,
    modelName: 'Drug',
    tableName: 'tn_drugs',
    timestamps: false
});

module.exports = Drug;
