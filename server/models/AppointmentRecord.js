const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AppointmentRecord = sequelize.define('AppointmentRecord', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    appointment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_appointments',
            key: 'id'
        }
    },
    reason: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status_before: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status_after: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    create_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    update_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tn_appointment_records',
    timestamps: false
});

module.exports = AppointmentRecord;