const { Model, DataTypes } = require('sequelize');
const sequelize = require('../DatabaseConnection');

class Notification extends Model { }

Notification.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    record_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    record_type: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_patients',
            key: 'id'
        }
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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
    sequelize,
    modelName: 'Notification',
    tableName: 'tn_notifications',
    timestamps: false
});

module.exports = Notification;
