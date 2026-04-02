const BaseRepository = require('./BaseRepository');
const { Patient } = require('../Database/Entity');

class PatientRepository extends BaseRepository {
    constructor() {
        super(Patient);
    }

    /**
     * Tìm patient theo email
     * @param {string} email 
     */
    async findByEmail(email) {
        return await this.findOne({ email });
    }

    /**
     * Tìm patient theo phone
     * @param {string} phone 
     */
    async findByPhone(phone) {
        return await this.findOne({ phone });
    }

    /**
     * Lấy danh sách patient active
     */
    async findAllActive() {
        return await this.findAllWhere({ is_active: true });
    }

    /**
     * Tìm kiếm patient theo tên hoặc email
     * @param {string} keyword 
     */
    async search(keyword) {
        const { Op } = require('sequelize');
        return await this.findAll({
            where: {
                [Op.or]: [
                    { full_name: { [Op.like]: `%${keyword}%` } },
                    { email: { [Op.like]: `%${keyword}%` } },
                    { phone: { [Op.like]: `%${keyword}%` } }
                ]
            }
        });
    }
}

module.exports = new PatientRepository();
