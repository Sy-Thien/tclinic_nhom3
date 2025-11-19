const { Room } = require('../models');
const { Op } = require('sequelize');

// GET - Lấy danh sách tất cả phòng khám
exports.getAllRooms = async (req, res) => {
    try {
        const { search } = req.query;

        console.log('📋 GET /api/admin/rooms', { search });

        let whereClause = {};

        // Tìm kiếm theo tên hoặc địa điểm
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } }
            ];
        }

        const rooms = await Room.findAll({
            where: whereClause,
            order: [['name', 'ASC']]
        });

        console.log(`✅ Found ${rooms.length} rooms`);

        res.json(rooms);
    } catch (error) {
        console.error('❌ Error fetching rooms:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách phòng khám',
            error: error.message
        });
    }
};

// GET - Lấy thông tin chi tiết 1 phòng khám
exports.getRoomById = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`📋 GET /api/admin/rooms/${id}`);

        const room = await Room.findByPk(id);

        if (!room) {
            return res.status(404).json({ message: 'Không tìm thấy phòng khám' });
        }

        console.log('✅ Room found:', room.name);

        res.json(room);
    } catch (error) {
        console.error('❌ Error fetching room:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy thông tin phòng khám',
            error: error.message
        });
    }
};

// POST - Thêm phòng khám mới
exports.createRoom = async (req, res) => {
    try {
        const { name, location } = req.body;

        console.log('➕ POST /api/admin/rooms', { name });

        // Validation
        if (!name) {
            return res.status(400).json({
                message: 'Vui lòng nhập tên phòng khám'
            });
        }

        // Kiểm tra tên đã tồn tại
        const existingRoom = await Room.findOne({ where: { name } });
        if (existingRoom) {
            return res.status(400).json({
                message: 'Phòng khám đã tồn tại'
            });
        }

        // Tạo phòng khám mới
        const room = await Room.create({
            name,
            location: location || null
        });

        console.log('✅ Room created:', room.id);

        res.status(201).json({
            message: 'Thêm phòng khám thành công',
            room
        });
    } catch (error) {
        console.error('❌ Error creating room:', error);
        res.status(500).json({
            message: 'Lỗi khi thêm phòng khám',
            error: error.message
        });
    }
};

// PUT - Cập nhật thông tin phòng khám
exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location } = req.body;

        console.log(`✏️ PUT /api/admin/rooms/${id}`);

        // Tìm phòng khám
        const room = await Room.findByPk(id);
        if (!room) {
            return res.status(404).json({ message: 'Không tìm thấy phòng khám' });
        }

        // Kiểm tra tên trùng (nếu thay đổi tên)
        if (name && name !== room.name) {
            const existingRoom = await Room.findOne({ where: { name } });
            if (existingRoom) {
                return res.status(400).json({
                    message: 'Tên phòng khám đã tồn tại'
                });
            }
        }

        // Cập nhật
        await room.update({
            name: name || room.name,
            location: location !== undefined ? location : room.location
        });

        console.log('✅ Room updated:', id);

        res.json({
            message: 'Cập nhật phòng khám thành công',
            room
        });
    } catch (error) {
        console.error('❌ Error updating room:', error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật phòng khám',
            error: error.message
        });
    }
};

// DELETE - Xóa phòng khám
exports.deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🗑️ DELETE /api/admin/rooms/${id}`);

        const room = await Room.findByPk(id);
        if (!room) {
            return res.status(404).json({ message: 'Không tìm thấy phòng khám' });
        }

        // Xóa phòng khám
        await room.destroy();

        console.log('✅ Room deleted:', id);

        res.json({
            message: 'Xóa phòng khám thành công'
        });
    } catch (error) {
        console.error('❌ Error deleting room:', error);
        res.status(500).json({
            message: 'Lỗi khi xóa phòng khám',
            error: error.message
        });
    }
};

module.exports = exports;
