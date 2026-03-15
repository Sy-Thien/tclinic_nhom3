'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.renameTable('doctor_schedules', 'tn_doctor_schedules');
        console.log('✅ Renamed doctor_schedules → tn_doctor_schedules');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.renameTable('tn_doctor_schedules', 'doctor_schedules');
        console.log('✅ Reverted tn_doctor_schedules → doctor_schedules');
    }
};
