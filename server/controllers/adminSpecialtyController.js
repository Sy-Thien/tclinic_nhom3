const { Specialty, Doctor, Service } = require('../models');
const { Op } = require('sequelize');

// GET - Lấy danh sách tất cả chuyên khoa
exports.getAllSpecialties = async (req, res) => {
    try {
        const { search } = req.query;

        console.log('📋 GET /api/admin/specialties', { search });

        let whereClause = {};

        // Tìm kiếm theo tên
        if (search) {
            whereClause.name = { [Op.like]: `%${search}%` };
        }

        const specialties = await Specialty.findAll({
            where: whereClause,
            include: [
                {
                    model: Doctor,
                    as: 'doctors',
                    attributes: ['id', 'full_name'],
                    required: false
                },
                {
                    model: Service,
                    as: 'services',
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            order: [['id', 'ASC']]
        });

        // Thêm số lượng bác sĩ và dịch vụ
        const specialtiesWithCounts = specialties.map(specialty => {
            const data = specialty.toJSON();
            return {
                ...data,
                doctorCount: data.doctors?.length || 0,
                serviceCount: data.services?.length || 0
            };
        });

        console.log(`✅ Found ${specialties.length} specialties`);

        res.json(specialtiesWithCounts);
    } catch (error) {
        console.error('❌ Error fetching specialties:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách chuyên khoa',
            error: error.message
        });
    }
};

// GET - Lấy thông tin chi tiết 1 chuyên khoa
exports.getSpecialtyById = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`📋 GET /api/admin/specialties/${id}`);

        const specialty = await Specialty.findByPk(id, {
            include: [
                {
                    model: Doctor,
                    as: 'doctors',
                    attributes: ['id', 'full_name', 'phone', 'email', 'is_active']
                },
                {
                    model: Service,
                    as: 'services',
                    attributes: ['id', 'name', 'price', 'duration']
                }
            ]
        });

        if (!specialty) {
            return res.status(404).json({ message: 'Không tìm thấy chuyên khoa' });
        }

        console.log('✅ Specialty found:', specialty.name);

        res.json(specialty);
    } catch (error) {
        console.error('❌ Error fetching specialty:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy thông tin chuyên khoa',
            error: error.message
        });
    }
};

// POST - Thêm chuyên khoa mới
exports.createSpecialty = async (req, res) => {
    try {
        const { name, description, image } = req.body;

        console.log('➕ POST /api/admin/specialties', { name });

        // Validation
        if (!name) {
            return res.status(400).json({
                message: 'Vui lòng nhập tên chuyên khoa'
            });
        }

        // Kiểm tra tên đã tồn tại
        const existingSpecialty = await Specialty.findOne({ where: { name } });
        if (existingSpecialty) {
            return res.status(400).json({
                message: 'Chuyên khoa đã tồn tại'
            });
        }

        // Tạo chuyên khoa mới
        const specialty = await Specialty.create({
            name,
            description: description || null,
            image: image || null,
            created_at: new Date(),
            updated_at: new Date()
        });

        console.log('✅ Specialty created:', specialty.id);

        res.status(201).json({
            message: 'Thêm chuyên khoa thành công',
            specialty
        });
    } catch (error) {
        console.error('❌ Error creating specialty:', error);
        res.status(500).json({
            message: 'Lỗi khi thêm chuyên khoa',
            error: error.message
        });
    }
};

// PUT - Cập nhật thông tin chuyên khoa
exports.updateSpecialty = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image } = req.body;

        console.log(`✏️ PUT /api/admin/specialties/${id}`);

        // Tìm chuyên khoa
        const specialty = await Specialty.findByPk(id);
        if (!specialty) {
            return res.status(404).json({ message: 'Không tìm thấy chuyên khoa' });
        }

        // Kiểm tra tên trùng (nếu thay đổi tên)
        if (name && name !== specialty.name) {
            const existingSpecialty = await Specialty.findOne({ where: { name } });
            if (existingSpecialty) {
                return res.status(400).json({
                    message: 'Tên chuyên khoa đã tồn tại'
                });
            }
        }

        // Cập nhật
        await specialty.update({
            name: name || specialty.name,
            description: description !== undefined ? description : specialty.description,
            image: image !== undefined ? image : specialty.image,
            updated_at: new Date()
        });

        console.log('✅ Specialty updated:', id);

        res.json({
            message: 'Cập nhật chuyên khoa thành công',
            specialty
        });
    } catch (error) {
        console.error('❌ Error updating specialty:', error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật chuyên khoa',
            error: error.message
        });
    }
};

// DELETE - Xóa chuyên khoa
exports.deleteSpecialty = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🗑️ DELETE /api/admin/specialties/${id}`);

        const specialty = await Specialty.findByPk(id);
        if (!specialty) {
            return res.status(404).json({ message: 'Không tìm thấy chuyên khoa' });
        }

        // Kiểm tra xem có bác sĩ hoặc dịch vụ không
        const doctorCount = await Doctor.count({ where: { specialty_id: id } });
        const serviceCount = await Service.count({ where: { specialty_id: id } });

        if (doctorCount > 0 || serviceCount > 0) {
            return res.status(400).json({
                message: `Không thể xóa chuyên khoa đã có ${doctorCount} bác sĩ và ${serviceCount} dịch vụ. Vui lòng chuyển họ sang chuyên khoa khác trước.`
            });
        }

        // Xóa chuyên khoa
        await specialty.destroy();

        console.log('✅ Specialty deleted:', id);

        res.json({
            message: 'Xóa chuyên khoa thành công'
        });
    } catch (error) {
        console.error('❌ Error deleting specialty:', error);
        res.status(500).json({
            message: 'Lỗi khi xóa chuyên khoa',
            error: error.message
        });
    }
};

module.exports = exports;
