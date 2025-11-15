const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookingPhoto = sequelize.define('BookingPhoto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    booking_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_booking',
            key: 'id'
        }
    }
}, {
    tableName: 'tn_booking_photo',
    timestamps: false
});

module.exports = BookingPhoto;