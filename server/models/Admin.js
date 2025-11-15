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
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    // ❌ Bỏ cột name nếu database không có
    // name: {
    //   type: DataTypes.STRING(100),
    //   allowNull: true
    // },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    role: {
        type: DataTypes.STRING(20),
        defaultValue: 'admin'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
    }
}, {
    tableName: 'tn_admins',
    timestamps: false
});

module.exports = Admin;