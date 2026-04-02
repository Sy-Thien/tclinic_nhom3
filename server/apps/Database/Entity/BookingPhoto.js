const { Model, DataTypes } = require('sequelize');
const sequelize = require('../DatabaseConnection');

class BookingPhoto extends Model { }

BookingPhoto.init({
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
    sequelize,
    modelName: 'BookingPhoto',
    tableName: 'tn_booking_photo',
    timestamps: false
});

module.exports = BookingPhoto;
