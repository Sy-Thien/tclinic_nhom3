const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
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
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(15),
        allowNull: true
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    specialty_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    clinic_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    role: {
        type: DataTypes.STRING(10),
        defaultValue: 'doctor'
    },
    recovery_token: {
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
    tableName: 'tn_doctors',
    timestamps: false
});

module.exports = Doctor;