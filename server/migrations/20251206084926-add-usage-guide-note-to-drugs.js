'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tn_drugs', 'usage_guide', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Hướng dẫn sử dụng thuốc'
    });

    await queryInterface.addColumn('tn_drugs', 'note', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Ghi chú về thuốc'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tn_drugs', 'usage_guide');
    await queryInterface.removeColumn('tn_drugs', 'note');
  }
};
