const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'tn_rooms',
    timestamps: false
});

module.exports = Room;