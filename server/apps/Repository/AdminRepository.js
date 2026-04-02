const BaseRepository = require('./BaseRepository');
const { Admin } = require('../Database/Entity');

class AdminRepository extends BaseRepository {
    constructor() {
        super(Admin);
    }

    /**
     * Tìm admin theo username
     * @param {string} username 
     */
    async findByUsername(username) {
        return await this.findOne({ username });
    }

    /**
     * Tìm admin theo email
     * @param {string} email 
     */
    async findByEmail(email) {
        return await this.findOne({ email });
    }

    /**
     * Lấy danh sách admin active
     */
    async findAllActive() {
        return await this.findAllWhere({ is_active: true });
    }
}

module.exports = new AdminRepository();
