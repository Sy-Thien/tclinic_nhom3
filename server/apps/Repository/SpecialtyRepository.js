const BaseRepository = require('./BaseRepository');
const { Specialty, Service, Doctor } = require('../Database/Entity');

class SpecialtyRepository extends BaseRepository {
    constructor() {
        super(Specialty);
    }

    /**
     * Lấy specialty với services
     * @param {number} id 
     */
    async findByIdWithServices(id) {
        return await this.findById(id, {
            include: [{ model: Service, as: 'services' }]
        });
    }

    /**
     * Lấy specialty với doctors
     * @param {number} id 
     */
    async findByIdWithDoctors(id) {
        return await this.findById(id, {
            include: [{ model: Doctor, as: 'doctors', where: { is_active: true }, required: false }]
        });
    }

    /**
     * Lấy tất cả specialties active với services
     */
    async findAllActiveWithServices() {
        return await this.findAll({
            where: { is_active: true },
            include: [{ model: Service, as: 'services' }]
        });
    }

    /**
     * Tìm specialty theo tên
     * @param {string} name 
     */
    async findByName(name) {
        return await this.findOne({ name });
    }
}

module.exports = new SpecialtyRepository();
