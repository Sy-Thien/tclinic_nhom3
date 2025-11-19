const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    full_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true
    },
    birthday: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true
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
    tableName: 'tn_patients',
    timestamps: false
});

module.exports = Patient;