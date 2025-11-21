'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('doctor_schedules', {
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
      day_of_week: {
        type: Sequelize.ENUM('Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'),
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      break_start: {
        type: Sequelize.TIME,
        allowNull: true
      },
      break_end: {
        type: Sequelize.TIME,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Tạo index để tăng tốc độ tìm kiếm
    await queryInterface.addIndex('doctor_schedules', ['doctor_id']);
    await queryInterface.addIndex('doctor_schedules', ['day_of_week']);
    await queryInterface.addIndex('doctor_schedules', ['doctor_id', 'day_of_week'], { unique: true, name: 'unique_doctor_day' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('doctor_schedules');
  }
};
