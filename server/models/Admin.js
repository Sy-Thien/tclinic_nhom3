const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Admin = sequelize.define('Admin', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
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
    full_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    role: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: 'admin'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true
    },
    reset_token: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    reset_expire: {
        type: DataTypes.DATE,
        allowNull: true
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
    tableName: 'tn_admins',
    timestamps: false
});

module.exports = Admin;