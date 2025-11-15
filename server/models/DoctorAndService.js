const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DoctorAndService = sequelize.define('DoctorAndService', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_services',
            key: 'id'
        }
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_doctors',
            key: 'id'
        }
    }
}, {
    tableName: 'tn_doctor_and_service',
    timestamps: false
});

module.exports = DoctorAndService;