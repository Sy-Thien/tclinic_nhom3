'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Thêm cột approval_status
        await queryInterface.addColumn('doctor_schedules', 'approval_status', {
            type: Sequelize.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'approved', // Lịch cũ mặc định là approved
            after: 'is_active'
        });

        // Thêm cột approved_by (admin nào duyệt)
        await queryInterface.addColumn('doctor_schedules', 'approved_by', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'tn_admins',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            after: 'approval_status'
        });

        // Thêm cột approved_at (thời gian duyệt)
        await queryInterface.addColumn('doctor_schedules', 'approved_at', {
            type: Sequelize.DATE,
            allowNull: true,
            after: 'approved_by'
        });

        // Thêm cột rejection_reason (lý do từ chối)
        await queryInterface.addColumn('doctor_schedules', 'rejection_reason', {
            type: Sequelize.TEXT,
            allowNull: true,
            after: 'approved_at'
        });

        // Tạo index cho approval_status để tìm kiếm nhanh
        await queryInterface.addIndex('doctor_schedules', ['approval_status'], {
            name: 'idx_approval_status'
        });

        console.log('✅ Added approval workflow columns to doctor_schedules');
    },

    async down(queryInterface, Sequelize) {
        // Xóa index
        await queryInterface.removeIndex('doctor_schedules', 'idx_approval_status');

        // Xóa các cột
        await queryInterface.removeColumn('doctor_schedules', 'rejection_reason');
        await queryInterface.removeColumn('doctor_schedules', 'approved_at');
        await queryInterface.removeColumn('doctor_schedules', 'approved_by');
        await queryInterface.removeColumn('doctor_schedules', 'approval_status');

        console.log('✅ Removed approval workflow columns from doctor_schedules');
    }
};
