const { Room, Specialty, TimeSlot } = require('../Database/Entity');
const { Op } = require('sequelize');

// GET - Lấy danh sách tất cả phòng khám

class AdminRoomController {
        async getAllRooms(req, res) {
        try {
            const { search, floor, specialty_id, status } = req.query;

            console.log('📋 GET /api/admin/rooms', { search, floor, specialty_id, status });

            let whereClause = {};

            // Tìm kiếm theo tên hoặc địa điểm
            if (search) {
                whereClause[Op.or] = [
                    { name: { [Op.like]: `%${search}%` } },
                    { location: { [Op.like]: `%${search}%` } },
                    { room_number: { [Op.like]: `%${search}%` } }
                ];
            }

            // Lọc theo tầng
            if (floor) {
                whereClause.floor = floor;
            }

            // Lọc theo chuyên khoa
            if (specialty_id) {
                whereClause.specialty_id = specialty_id;
            }

            // Lọc theo trạng thái
            if (status) {
                whereClause.status = status;
            }

            const rooms = await Room.findAll({
                where: whereClause,
                include: [{
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }],
                order: [['floor', 'ASC'], ['room_number', 'ASC'], ['name', 'ASC']]
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

    // GET - Lấy danh sách các tầng có phòng khám
        async getFloors(req, res) {
        try {
            const rooms = await Room.findAll({
                attributes: ['floor'],
                group: ['floor'],
                order: [['floor', 'ASC']]
            });

            const floors = rooms.map(r => r.floor).filter(f => f !== null);
            res.json(floors);
        } catch (error) {
            console.error('❌ Error fetching floors:', error);
            res.status(500).json({ message: 'Lỗi khi lấy danh sách tầng' });
        }
    };

    // GET - Lấy thống kê phòng khám theo tầng
        async getRoomStats(req, res) {
        try {
            const rooms = await Room.findAll({
                include: [{
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }]
            });

            // Nhóm theo tầng
            const byFloor = {};
            const bySpecialty = {};
            const byStatus = { active: 0, inactive: 0, maintenance: 0 };

            rooms.forEach(room => {
                // Theo tầng
                const floor = room.floor || 0;
                if (!byFloor[floor]) {
                    byFloor[floor] = { count: 0, specialties: new Set() };
                }
                byFloor[floor].count++;
                if (room.specialty) {
                    byFloor[floor].specialties.add(room.specialty.name);
                }

                // Theo chuyên khoa
                const specName = room.specialty?.name || 'Chưa phân loại';
                if (!bySpecialty[specName]) {
                    bySpecialty[specName] = 0;
                }
                bySpecialty[specName]++;

                // Theo trạng thái
                byStatus[room.status]++;
            });

            // Convert Set to Array
            Object.keys(byFloor).forEach(floor => {
                byFloor[floor].specialties = Array.from(byFloor[floor].specialties);
            });

            res.json({
                total: rooms.length,
                byFloor,
                bySpecialty,
                byStatus
            });
        } catch (error) {
            console.error('❌ Error fetching room stats:', error);
            res.status(500).json({ message: 'Lỗi khi lấy thống kê phòng khám' });
        }
    };

    // GET - Lấy thông tin chi tiết 1 phòng khám
        async getRoomById(req, res) {
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
        async createRoom(req, res) {
        try {
            const { name, room_number, floor, specialty_id, location, status, capacity, description } = req.body;

            console.log('➕ POST /api/admin/rooms', { name, floor, specialty_id });

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
                    message: 'Tên phòng khám đã tồn tại'
                });
            }

            // Kiểm tra số phòng đã tồn tại trong cùng tầng
            if (room_number && floor) {
                const existingRoomNumber = await Room.findOne({
                    where: { room_number, floor }
                });
                if (existingRoomNumber) {
                    return res.status(400).json({
                        message: `Số phòng ${room_number} đã tồn tại ở tầng ${floor}`
                    });
                }
            }

            // Tạo phòng khám mới
            const room = await Room.create({
                name,
                room_number: room_number || null,
                floor: floor || 1,
                specialty_id: specialty_id || null,
                location: location || null,
                status: status || 'active',
                capacity: capacity || 1,
                description: description || null
            });

            // Reload với specialty
            const createdRoom = await Room.findByPk(room.id, {
                include: [{
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }]
            });

            console.log('✅ Room created:', room.id);

            res.status(201).json({
                message: 'Thêm phòng khám thành công',
                room: createdRoom
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
        async updateRoom(req, res) {
        try {
            const { id } = req.params;
            const { name, room_number, floor, specialty_id, location, status, capacity, description } = req.body;

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

            // Kiểm tra số phòng trùng trong cùng tầng
            if (room_number && floor) {
                const existingRoomNumber = await Room.findOne({
                    where: {
                        room_number,
                        floor,
                        id: { [Op.ne]: id }
                    }
                });
                if (existingRoomNumber) {
                    return res.status(400).json({
                        message: `Số phòng ${room_number} đã tồn tại ở tầng ${floor}`
                    });
                }
            }

            // Cập nhật
            await room.update({
                name: name !== undefined ? name : room.name,
                room_number: room_number !== undefined ? room_number : room.room_number,
                floor: floor !== undefined ? floor : room.floor,
                specialty_id: specialty_id !== undefined ? specialty_id : room.specialty_id,
                location: location !== undefined ? location : room.location,
                status: status !== undefined ? status : room.status,
                capacity: capacity !== undefined ? capacity : room.capacity,
                description: description !== undefined ? description : room.description
            });

            // Reload với specialty
            const updatedRoom = await Room.findByPk(id, {
                include: [{
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }]
            });

            console.log('✅ Room updated:', id);

            res.json({
                message: 'Cập nhật phòng khám thành công',
                room: updatedRoom
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
        async deleteRoom(req, res) {
        try {
            const { id } = req.params;

            console.log(`🗑️ DELETE /api/admin/rooms/${id}`);

            const room = await Room.findByPk(id);
            if (!room) {
                return res.status(404).json({ message: 'Không tìm thấy phòng khám' });
            }

            // ✅ Kiểm tra xem phòng có TimeSlot nào đang được sử dụng không
            const timeSlotsCount = await TimeSlot.count({ where: { room_id: id } });
            if (timeSlotsCount > 0) {
                return res.status(400).json({
                    message: `Không thể xóa phòng này vì đang có ${timeSlotsCount} lịch khám liên kết. Vui lòng xóa lịch khám trước hoặc chuyển sang phòng khác.`
                });
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

}

module.exports = new AdminRoomController();



