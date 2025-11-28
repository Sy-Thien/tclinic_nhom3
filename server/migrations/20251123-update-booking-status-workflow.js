'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Thêm field reject_reason
        await queryInterface.addColumn('tn_booking', 'reject_reason', {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Lý do bác sĩ từ chối'
        });

        // Update ENUM status với các giá trị mới
        await queryInterface.changeColumn('tn_booking', 'status', {
            type: Sequelize.ENUM(
                'pending',
                'waiting_doctor_assignment',
                'waiting_doctor_confirmation',
                'confirmed',
                'completed',
                'cancelled',
                'doctor_rejected'
            ),
            allowNull: true,
            defaultValue: 'pending'
        });

        // Update comment cho cancel_reason
        await queryInterface.changeColumn('tn_booking', 'cancel_reason', {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Lý do hủy'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Rollback: xóa field reject_reason
        await queryInterface.removeColumn('tn_booking', 'reject_reason');

        // Rollback: status về ENUM cũ
        await queryInterface.changeColumn('tn_booking', 'status', {
            type: Sequelize.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
            allowNull: true,
            defaultValue: 'pending'
        });
    }
};
