const { Model, DataTypes } = require('sequelize');
const sequelize = require('../DatabaseConnection');

class Service extends Model { }

Service.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true,
        defaultValue: 0
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    specialty_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tn_specialties',
            key: 'id'
        }
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
    sequelize,
    modelName: 'Service',
    tableName: 'tn_services',
    timestamps: false
});

module.exports = Service;
