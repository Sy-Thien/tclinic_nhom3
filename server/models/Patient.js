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
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    gender: {
        type: DataTypes.INTEGER,
        defaultValue: 0
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
    tableName: 'tn_patients',
    timestamps: false
});

module.exports = Patient;