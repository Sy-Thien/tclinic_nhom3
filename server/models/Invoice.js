const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    booking_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    patient_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    patient_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    doctor_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    service_fee: {
        type: DataTypes.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0
    },
    drug_fee: {
        type: DataTypes.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0
    },
    other_fee: {
        type: DataTypes.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0
    },
    discount: {
        type: DataTypes.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0
    },
    total_amount: {
        type: DataTypes.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0
    },
    payment_method: {
        type: DataTypes.ENUM('cash', 'vnpay', 'transfer', 'card'),
        allowNull: false,
        defaultValue: 'cash'
    },
    payment_status: {
        type: DataTypes.ENUM('pending', 'paid', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
    },
    paid_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    transaction_id: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tn_invoices',
    timestamps: false
});

module.exports = Invoice;
