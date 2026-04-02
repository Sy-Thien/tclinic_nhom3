/**
 * Base Repository - Lớp cơ sở cho tất cả repositories
 * Cung cấp các phương thức CRUD chuẩn
 */
class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    /**
     * Tìm tất cả records
     * @param {Object} options - Sequelize query options
     */
    async findAll(options = {}) {
        return await this.model.findAll(options);
    }

    /**
     * Tìm theo ID
     * @param {number} id 
     * @param {Object} options 
     */
    async findById(id, options = {}) {
        return await this.model.findByPk(id, options);
    }

    /**
     * Tìm một record theo điều kiện
     * @param {Object} where - Điều kiện tìm kiếm
     * @param {Object} options 
     */
    async findOne(where, options = {}) {
        return await this.model.findOne({ where, ...options });
    }

    /**
     * Tìm tất cả theo điều kiện
     * @param {Object} where 
     * @param {Object} options 
     */
    async findAllWhere(where, options = {}) {
        return await this.model.findAll({ where, ...options });
    }

    /**
     * Tạo mới record
     * @param {Object} data 
     */
    async create(data) {
        return await this.model.create(data);
    }

    /**
     * Tạo nhiều records
     * @param {Array} dataArray 
     */
    async bulkCreate(dataArray, options = {}) {
        return await this.model.bulkCreate(dataArray, options);
    }

    /**
     * Cập nhật record theo ID
     * @param {number} id 
     * @param {Object} data 
     */
    async updateById(id, data) {
        const record = await this.findById(id);
        if (!record) return null;
        return await record.update(data);
    }

    /**
     * Cập nhật theo điều kiện
     * @param {Object} where 
     * @param {Object} data 
     */
    async updateWhere(where, data) {
        return await this.model.update(data, { where });
    }

    /**
     * Xóa theo ID
     * @param {number} id 
     */
    async deleteById(id) {
        const record = await this.findById(id);
        if (!record) return false;
        await record.destroy();
        return true;
    }

    /**
     * Xóa theo điều kiện
     * @param {Object} where 
     */
    async deleteWhere(where) {
        return await this.model.destroy({ where });
    }

    /**
     * Đếm số lượng records
     * @param {Object} where 
     */
    async count(where = {}) {
        return await this.model.count({ where });
    }

    /**
     * Tìm hoặc tạo mới
     * @param {Object} where 
     * @param {Object} defaults 
     */
    async findOrCreate(where, defaults = {}) {
        return await this.model.findOrCreate({ where, defaults });
    }

    /**
     * Phân trang
     * @param {number} page 
     * @param {number} limit 
     * @param {Object} options 
     */
    async paginate(page = 1, limit = 10, options = {}) {
        const offset = (page - 1) * limit;
        const { count, rows } = await this.model.findAndCountAll({
            ...options,
            limit,
            offset
        });
        return {
            data: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        };
    }
}

module.exports = BaseRepository;
