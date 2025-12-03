'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Thêm cột doctor_reply cho phản hồi của bác sĩ
        await queryInterface.addColumn('tn_reviews', 'doctor_reply', {
            type: Sequelize.TEXT,
            allowNull: true,
            after: 'comment'
        });

        // Thêm cột replied_at cho thời gian phản hồi
        await queryInterface.addColumn('tn_reviews', 'replied_at', {
            type: Sequelize.DATE,
            allowNull: true,
            after: 'doctor_reply'
        });

        console.log('✅ Added doctor_reply and replied_at columns to tn_reviews');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('tn_reviews', 'doctor_reply');
        await queryInterface.removeColumn('tn_reviews', 'replied_at');
    }
};
