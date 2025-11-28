const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_patients',
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
    },
    booking_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tn_booking',
            key: 'id'
        }
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
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
    tableName: 'tn_reviews',
    timestamps: false
});

module.exports = Review;
