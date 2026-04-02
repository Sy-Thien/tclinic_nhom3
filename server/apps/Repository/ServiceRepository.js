const BaseRepository = require('./BaseRepository');
const { Service, Specialty } = require('../Database/Entity');

class ServiceRepository extends BaseRepository {
    constructor() {
        super(Service);
    }

    /**
     * Lấy service với specialty
     * @param {number} id 
     */
    async findByIdWithSpecialty(id) {
        return await this.findById(id, {
            include: [{ model: Specialty, as: 'specialty' }]
        });
    }

    /**
     * Lấy services theo specialty
     * @param {number} specialtyId 
     */
    async findBySpecialty(specialtyId) {
        return await this.findAllWhere({
            specialty_id: specialtyId,
            is_active: true
        });
    }

    /**
     * Lấy tất cả services active
     */
    async findAllActiveWithSpecialty() {
        return await this.findAll({
            where: { is_active: true },
            include: [{ model: Specialty, as: 'specialty' }]
        });
    }
}

module.exports = new ServiceRepository();
