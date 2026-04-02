const BaseRepository = require('./BaseRepository');
const { Room, Specialty, TimeSlot } = require('../Database/Entity');

class RoomRepository extends BaseRepository {
    constructor() {
        super(Room);
    }

    /**
     * Lấy room với specialty
     * @param {number} id 
     */
    async findByIdWithSpecialty(id) {
        return await this.findById(id, {
            include: [{ model: Specialty, as: 'specialty' }]
        });
    }

    /**
     * Lấy rooms theo specialty
     * @param {number} specialtyId 
     */
    async findBySpecialty(specialtyId) {
        return await this.findAllWhere({
            specialty_id: specialtyId,
            is_active: true
        });
    }

    /**
     * Lấy tất cả rooms active
     */
    async findAllActive() {
        return await this.findAll({
            where: { is_active: true },
            include: [{ model: Specialty, as: 'specialty' }]
        });
    }

    /**
     * Tìm room theo tên
     * @param {string} name 
     */
    async findByName(name) {
        return await this.findOne({ name });
    }
}

module.exports = new RoomRepository();
