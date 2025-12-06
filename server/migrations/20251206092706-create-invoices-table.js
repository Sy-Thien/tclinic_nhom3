'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Bảng hóa đơn chính
    await queryInterface.createTable('tn_invoices', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      invoice_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Mã hóa đơn: INV + timestamp'
      },
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tn_booking', key: 'id' }
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'tn_patients', key: 'id' }
      },
      patient_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      patient_phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'tn_doctors', key: 'id' }
      },
      doctor_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      // Chi phí
      service_fee: {
        type: Sequelize.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0,
        comment: 'Phí khám bệnh'
      },
      drug_fee: {
        type: Sequelize.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0,
        comment: 'Tiền thuốc'
      },
      other_fee: {
        type: Sequelize.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0,
        comment: 'Phí khác'
      },
      discount: {
        type: Sequelize.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0,
        comment: 'Giảm giá'
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng tiền'
      },
      // Thanh toán
      payment_method: {
        type: Sequelize.ENUM('cash', 'vnpay', 'transfer', 'card'),
        allowNull: false,
        defaultValue: 'cash',
        comment: 'Phương thức: tiền mặt, VNPay, chuyển khoản, thẻ'
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'paid', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Trạng thái: chờ, đã thanh toán, hủy, hoàn tiền'
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời điểm thanh toán'
      },
      transaction_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Mã giao dịch VNPay/Bank'
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID người tạo hóa đơn (doctor/admin)'
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

    // Bảng chi tiết hóa đơn (thuốc)
    await queryInterface.createTable('tn_invoice_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      invoice_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tn_invoices', key: 'id' },
        onDelete: 'CASCADE'
      },
      item_type: {
        type: Sequelize.ENUM('service', 'drug', 'other'),
        allowNull: false,
        defaultValue: 'drug'
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID thuốc hoặc dịch vụ'
      },
      item_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0
      },
      total_price: {
        type: Sequelize.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index
    await queryInterface.addIndex('tn_invoices', ['booking_id']);
    await queryInterface.addIndex('tn_invoices', ['patient_id']);
    await queryInterface.addIndex('tn_invoices', ['payment_status']);
    await queryInterface.addIndex('tn_invoices', ['created_at']);
    await queryInterface.addIndex('tn_invoice_items', ['invoice_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tn_invoice_items');
    await queryInterface.dropTable('tn_invoices');
  }
};