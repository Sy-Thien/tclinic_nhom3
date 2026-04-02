const { Model, DataTypes } = require('sequelize');
const sequelize = require('../DatabaseConnection');

class Treatment extends Model { }

Treatment.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    booking_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_booking',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    times: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    purpose: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    instruction: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    repeat_days: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    repeat_time: {
        type: DataTypes.STRING(5),
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Treatment',
    tableName: 'tn_treatments',
    timestamps: false
});

module.exports = Treatment;
