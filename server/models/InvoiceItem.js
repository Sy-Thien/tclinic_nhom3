const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InvoiceItem = sequelize.define('InvoiceItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    item_type: {
        type: DataTypes.ENUM('service', 'drug', 'other'),
        allowNull: false,
        defaultValue: 'drug'
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    item_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    unit: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    unit_price: {
        type: DataTypes.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0
    },
    total_price: {
        type: DataTypes.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tn_invoice_items',
    timestamps: false
});

module.exports = InvoiceItem;
