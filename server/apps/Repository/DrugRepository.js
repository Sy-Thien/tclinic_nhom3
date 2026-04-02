const BaseRepository = require('./BaseRepository');
const { Drug } = require('../Database/Entity');
const { Op } = require('sequelize');

class DrugRepository extends BaseRepository {
    constructor() {
        super(Drug);
    }

    /**
     * Tìm thuốc theo tên
     * @param {string} name 
     */
    async findByName(name) {
        return await this.findOne({ name });
    }

    /**
     * Tìm kiếm thuốc
     * @param {string} keyword 
     */
    async search(keyword) {
        return await this.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${keyword}%` } },
                    { generic_name: { [Op.like]: `%${keyword}%` } }
                ]
            }
        });
    }

    /**
     * Lấy thuốc sắp hết hàng (stock < minStock)
     */
    async findLowStock() {
        return await this.findAll({
            where: {
                stock: { [Op.lt]: this.model.sequelize.col('min_stock') }
            }
        });
    }

    /**
     * Cập nhật số lượng tồn kho
     * @param {number} id 
     * @param {number} quantity - Số lượng thay đổi (- để giảm, + để tăng)
     */
    async updateStock(id, quantity) {
        const drug = await this.findById(id);
        if (!drug) return null;

        const newStock = drug.stock + quantity;
        if (newStock < 0) {
            throw new Error('Số lượng tồn kho không đủ');
        }

        return await drug.update({ stock: newStock });
    }
}

module.exports = new DrugRepository();
