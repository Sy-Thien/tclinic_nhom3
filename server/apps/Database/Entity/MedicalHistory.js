const { Model, DataTypes } = require('sequelize');
const sequelize = require('../DatabaseConnection');

class MedicalHistory extends Model { }

MedicalHistory.init({
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
    visit_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    visit_time: {
        type: DataTypes.STRING(5),
        allowNull: true
    },
    symptoms: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    diagnosis: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    conclusion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    treatment_plan: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    prescription_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tn_prescriptions',
            key: 'id'
        }
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'MedicalHistory',
    tableName: 'tn_medical_history',
    timestamps: false
});

module.exports = MedicalHistory;

