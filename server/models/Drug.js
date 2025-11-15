const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Drug = sequelize.define('Drug', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: 'tn_drugs',
    timestamps: false
});

module.exports = Drug;