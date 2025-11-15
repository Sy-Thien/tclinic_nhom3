const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Specialty = sequelize.define('Specialty', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
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
    tableName: 'tn_specialties',
    timestamps: false
});

module.exports = Specialty;