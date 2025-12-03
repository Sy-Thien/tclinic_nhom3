'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('tn_consultation_requests', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            patient_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'tn_patients',
                    key: 'id'
                },
                onDelete: 'SET NULL',
                comment: 'NULL nếu là guest user'
            },
            guest_name: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'Tên người gửi nếu không đăng nhập'
            },
            guest_email: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            guest_phone: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            subject: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Chủ đề yêu cầu'
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'Nội dung chi tiết'
            },
            category: {
                type: Sequelize.ENUM('general', 'medical_inquiry', 'appointment', 'complaint', 'other'),
                defaultValue: 'general',
                comment: 'Phân loại yêu cầu'
            },
            specialty_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'tn_specialties',
                    key: 'id'
                },
                onDelete: 'SET NULL',
                comment: 'Chuyên khoa liên quan (admin assign)'
            },
            assigned_doctor_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'tn_doctors',
                    key: 'id'
                },
                onDelete: 'SET NULL',
                comment: 'Bác sĩ được admin chỉ định'
            },
            assigned_by_admin_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'tn_admins',
                    key: 'id'
                },
                onDelete: 'SET NULL'
            },
            assigned_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('pending', 'assigned', 'in_progress', 'resolved', 'closed'),
                defaultValue: 'pending',
                comment: 'pending: Chờ xử lý, assigned: Đã giao bác sĩ, in_progress: Đang tư vấn, resolved: Đã giải quyết, closed: Đã đóng'
            },
            priority: {
                type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
                defaultValue: 'medium'
            },
            admin_notes: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Ghi chú nội bộ của admin'
            },
            doctor_response: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Phản hồi từ bác sĩ'
            },
            responded_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            resolved_at: {
                type: Sequelize.DATE,
                allowNull: true
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
        });

        // Indexes for performance
        await queryInterface.addIndex('tn_consultation_requests', ['patient_id']);
        await queryInterface.addIndex('tn_consultation_requests', ['assigned_doctor_id']);
        await queryInterface.addIndex('tn_consultation_requests', ['status']);
        await queryInterface.addIndex('tn_consultation_requests', ['specialty_id']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('tn_consultation_requests');
    }
};
