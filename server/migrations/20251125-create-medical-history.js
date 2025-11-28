'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('tn_medical_history', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            booking_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'tn_booking',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'ID lịch khám'
            },
            patient_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'tn_patients',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'ID bệnh nhân'
            },
            doctor_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'tn_doctors',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'Bác sĩ khám'
            },
            visit_date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
                comment: 'Ngày khám'
            },
            visit_time: {
                type: Sequelize.STRING(5),
                allowNull: true,
                comment: 'Giờ khám'
            },
            symptoms: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Triệu chứng'
            },
            diagnosis: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Chẩn đoán'
            },
            conclusion: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Kết luận'
            },
            treatment_plan: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Phương pháp điều trị'
            },
            note: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Ghi chú bác sĩ'
            },
            prescription_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'tn_prescriptions',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
                comment: 'Đơn thuốc (nếu có)'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        }, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        });

        // Add indexes
        await queryInterface.addIndex('tn_medical_history', ['patient_id'], {
            name: 'idx_medical_history_patient'
        });

        await queryInterface.addIndex('tn_medical_history', ['doctor_id'], {
            name: 'idx_medical_history_doctor'
        });

        await queryInterface.addIndex('tn_medical_history', ['visit_date'], {
            name: 'idx_medical_history_date'
        });

        console.log('✅ Created tn_medical_history table');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('tn_medical_history');
        console.log('❌ Dropped tn_medical_history table');
    }
};
