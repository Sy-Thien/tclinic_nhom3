const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicalRecord = sequelize.define('MedicalRecord', {
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
    blood_type: {
        type: DataTypes.STRING(5),
        allowNull: true
    },
    allergies: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    chronic_diseases: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    family_history: {
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
    tableName: 'tn_medical_records',
    timestamps: false
});

module.exports = MedicalRecord;
