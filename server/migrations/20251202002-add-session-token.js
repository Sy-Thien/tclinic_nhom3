'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Thêm session_token vào tn_admins
        await queryInterface.addColumn('tn_admins', 'session_token', {
            type: Sequelize.STRING(255),
            allowNull: true
        });

        // Thêm session_token vào tn_doctors
        await queryInterface.addColumn('tn_doctors', 'session_token', {
            type: Sequelize.STRING(255),
            allowNull: true
        });

        // Thêm session_token vào tn_patients
        await queryInterface.addColumn('tn_patients', 'session_token', {
            type: Sequelize.STRING(255),
            allowNull: true
        });

        console.log('✅ Added session_token column to all user tables');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('tn_admins', 'session_token');
        await queryInterface.removeColumn('tn_doctors', 'session_token');
        await queryInterface.removeColumn('tn_patients', 'session_token');
    }
};
