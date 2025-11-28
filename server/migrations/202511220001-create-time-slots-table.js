'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('tn_time_slots', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            doctor_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'tn_doctors',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
                comment: 'Ngày khám (YYYY-MM-DD)'
            },
            start_time: {
                type: Sequelize.TIME,
                allowNull: false,
                comment: 'Giờ bắt đầu khung giờ'
            },
            end_time: {
                type: Sequelize.TIME,
                allowNull: false,
                comment: 'Giờ kết thúc khung giờ'
            },
            max_patients: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
                comment: 'Số lượng bệnh nhân tối đa trong khung giờ này'
            },
            current_patients: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Số lượng bệnh nhân đã đặt'
            },
            is_available: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                comment: 'Trạng thái có sẵn hay không'
            },
            room_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'tn_rooms',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            note: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Ghi chú'
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

        // Tạo index để tối ưu query
        await queryInterface.addIndex('tn_time_slots', ['doctor_id', 'date', 'start_time'], {
            unique: true,
            name: 'unique_doctor_date_time'
        });

        await queryInterface.addIndex('tn_time_slots', ['date'], {
            name: 'idx_time_slots_date'
        });

        await queryInterface.addIndex('tn_time_slots', ['doctor_id'], {
            name: 'idx_time_slots_doctor'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('tn_time_slots');
    }
};
