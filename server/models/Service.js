const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    specialty_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Thời gian khám (phút)'
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
    tableName: 'tn_services',
    timestamps: false
});

module.exports = Service;