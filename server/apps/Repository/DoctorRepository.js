const BaseRepository = require('./BaseRepository');
const { Doctor, Specialty } = require('../Database/Entity');

class DoctorRepository extends BaseRepository {
    constructor() {
        super(Doctor);
    }

    /**
     * Tìm doctor theo email
     * @param {string} email 
     */
    async findByEmail(email) {
        return await this.findOne({ email });
    }

    /**
     * Tìm doctor với specialty
     * @param {number} id 
     */
    async findByIdWithSpecialty(id) {
        return await this.findById(id, {
            include: [{ model: Specialty, as: 'specialty' }]
        });
    }

    /**
     * Lấy danh sách doctor active với specialty
     */
    async findAllActiveWithSpecialty() {
        return await this.findAll({
            where: { is_active: true },
            include: [{ model: Specialty, as: 'specialty' }]
        });
    }

    /**
     * Tìm doctors theo specialty
     * @param {number} specialtyId 
     */
    async findBySpecialty(specialtyId) {
        return await this.findAllWhere({
            specialty_id: specialtyId,
            is_active: true
        });
    }

    /**
     * Tìm kiếm doctor theo tên
     * @param {string} keyword 
     */
    async search(keyword) {
        const { Op } = require('sequelize');
        return await this.findAll({
            where: {
                [Op.or]: [
                    { full_name: { [Op.like]: `%${keyword}%` } },
                    { email: { [Op.like]: `%${keyword}%` } }
                ],
                is_active: true
            },
            include: [{ model: Specialty, as: 'specialty' }]
        });
    }
}

module.exports = new DoctorRepository();
