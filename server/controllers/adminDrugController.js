const { Drug } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// ✅ GET - Danh sách tất cả thuốc
exports.getAllDrugs = async (req, res) => {
    try {
        const { search, sortBy = 'name' } = req.query;
        console.log('📋 GET /api/admin/drugs', { search, sortBy });

        let where = {};
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { ingredient: { [Op.like]: `%${search}%` } }
            ];
        }

        const drugs = await Drug.findAll({
            where,
            order: [[sortBy || 'name', 'ASC']],
            attributes: ['id', 'name', 'ingredient', 'quantity', 'unit', 'expiry_date', 'warning_level', 'price', 'created_at', 'updated_at']
        });

        console.log(`✅ Found ${drugs.length} drugs`);
        res.json({
            success: true,
            data: drugs,
            total: drugs.length
        });
    } catch (error) {
        console.error('❌ Error fetching drugs:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ GET - Chi tiết thuốc
exports.getDrugById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📋 GET /api/admin/drugs/${id}`);

        const drug = await Drug.findByPk(id);

        if (!drug) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thuốc'
            });
        }

        console.log(`✅ Found drug: ${drug.name}`);
        res.json({
            success: true,
            data: drug
        });
    } catch (error) {
        console.error('❌ Error fetching drug:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ POST - Thêm thuốc mới
exports.createDrug = async (req, res) => {
    try {
        const { name, ingredient, quantity, unit, expiry_date, warning_level, price } = req.body;
        console.log('📝 POST /api/admin/drugs', { name, quantity, unit });

        if (!name || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc (tên, số lượng)'
            });
        }

        const drug = await Drug.create({
            name,
            ingredient: ingredient || null,
            quantity,
            unit: unit || 'viên',
            expiry_date: expiry_date || null,
            warning_level: warning_level || 10,
            price: price || 0
        });

        console.log(`✅ Drug created: ${drug.name} (ID: ${drug.id})`);
        res.status(201).json({
            success: true,
            message: 'Thêm thuốc thành công',
            data: drug
        });
    } catch (error) {
        console.error('❌ Error creating drug:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Tên thuốc đã tồn tại'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ PUT - Cập nhật thuốc
exports.updateDrug = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, ingredient, quantity, unit, expiry_date, warning_level, price } = req.body;
        console.log(`📝 PUT /api/admin/drugs/${id}`, { name, quantity });

        const drug = await Drug.findByPk(id);
        if (!drug) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thuốc'
            });
        }

        await drug.update({
            name: name !== undefined ? name : drug.name,
            ingredient: ingredient !== undefined ? ingredient : drug.ingredient,
            quantity: quantity !== undefined ? quantity : drug.quantity,
            unit: unit !== undefined ? unit : drug.unit,
            expiry_date: expiry_date !== undefined ? expiry_date : drug.expiry_date,
            warning_level: warning_level !== undefined ? warning_level : drug.warning_level,
            price: price !== undefined ? price : drug.price,
            updated_at: new Date()
        });

        console.log(`✅ Drug updated: ${drug.name}`);
        res.json({
            success: true,
            message: 'Cập nhật thuốc thành công',
            data: drug
        });
    } catch (error) {
        console.error('❌ Error updating drug:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ DELETE - Xóa thuốc
exports.deleteDrug = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`❌ DELETE /api/admin/drugs/${id}`);

        const drug = await Drug.findByPk(id);
        if (!drug) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thuốc'
            });
        }

        await drug.destroy();

        console.log(`✅ Drug deleted: ${drug.name}`);
        res.json({
            success: true,
            message: 'Xóa thuốc thành công',
            data: drug
        });
    } catch (error) {
        console.error('❌ Error deleting drug:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ GET - Cảnh báo tồn kho
exports.getStockWarnings = async (req, res) => {
    try {
        console.log('⚠️ GET /api/admin/drugs/stock/warnings');

        const drugs = await Drug.findAll({
            where: {
                [Op.or]: [
                    sequelize.where(
                        sequelize.col('quantity'),
                        Op.lte,
                        sequelize.col('warning_level')
                    ),
                    {
                        expiry_date: {
                            [Op.and]: [
                                { [Op.ne]: null },
                                { [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // 30 ngày tới
                            ]
                        }
                    }
                ]
            },
            order: [['quantity', 'ASC']],
            raw: true
        });

        const warnings = drugs.map(drug => ({
            id: drug.id,
            name: drug.name,
            quantity: drug.quantity,
            warning_level: drug.warning_level,
            expiry_date: drug.expiry_date,
            warning_type: drug.quantity <= drug.warning_level ? 'low_stock' : 'expiry_soon',
            message: drug.quantity <= drug.warning_level
                ? `Tồn kho: ${drug.quantity}/${drug.warning_level}`
                : `Hạn dùng: ${new Date(drug.expiry_date).toLocaleDateString('vi-VN')}`
        }));

        console.log(`⚠️ Found ${warnings.length} warnings`);
        res.json({
            success: true,
            data: warnings,
            total: warnings.length
        });
    } catch (error) {
        console.error('❌ Error fetching stock warnings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ PUT - Cập nhật tồn kho (tăng/giảm)
exports.updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, type = 'set' } = req.body; // type: set, add, remove
        console.log(`📊 PUT /api/admin/drugs/${id}/stock`, { quantity, type });

        const drug = await Drug.findByPk(id);
        if (!drug) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thuốc'
            });
        }

        let newQuantity = drug.quantity;
        if (type === 'set') {
            newQuantity = quantity;
        } else if (type === 'add') {
            newQuantity = drug.quantity + quantity;
        } else if (type === 'remove') {
            newQuantity = drug.quantity - quantity;
            if (newQuantity < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số lượng không đủ'
                });
            }
        }

        await drug.update({
            quantity: newQuantity,
            updated_at: new Date()
        });

        console.log(`✅ Stock updated: ${drug.name} -> ${newQuantity}`);
        res.json({
            success: true,
            message: 'Cập nhật tồn kho thành công',
            data: drug
        });
    } catch (error) {
        console.error('❌ Error updating stock:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = exports;
