const { Service, Specialty } = require('../models');

// GET - Danh sách dịch vụ
exports.getAllServices = async (req, res) => {
    try {
        const { specialty_id, search } = req.query;
        console.log('📋 Admin: GET all services');

        let whereClause = {};

        if (specialty_id) {
            whereClause.specialty_id = specialty_id;
        }

        const services = await Service.findAll({
            where: whereClause,
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            order: [['name', 'ASC']]
        });

        console.log(`✅ Found ${services.length} services`);
        res.json({ services });
    } catch (error) {
        console.error('❌ Error fetching services:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// GET - Chi tiết dịch vụ
exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📋 Admin: GET service ${id}`);

        const service = await Service.findByPk(id, {
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name', 'description']
                }
            ]
        });

        if (!service) {
            return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
        }

        res.json(service);
    } catch (error) {
        console.error('❌ Error fetching service:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// POST - Thêm dịch vụ mới
exports.createService = async (req, res) => {
    try {
        const { name, description, price, duration, specialty_id } = req.body;
        console.log('📋 Admin: CREATE service', { name, price, specialty_id });

        // Validate
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Tên dịch vụ là bắt buộc' });
        }

        // Check duplicate name
        const existing = await Service.findOne({ where: { name: name.trim() } });
        if (existing) {
            return res.status(400).json({ message: 'Tên dịch vụ đã tồn tại' });
        }

        const service = await Service.create({
            name: name.trim(),
            description: description?.trim() || null,
            price: price || 0,
            duration: duration || null,
            specialty_id: specialty_id || null
        });

        console.log(`✅ Created service: ${service.name} (ID: ${service.id})`);
        res.status(201).json({
            message: 'Thêm dịch vụ thành công',
            service
        });
    } catch (error) {
        console.error('❌ Error creating service:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// PUT - Cập nhật dịch vụ
exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, duration, specialty_id } = req.body;
        console.log(`📋 Admin: UPDATE service ${id}`, { name, price });

        const service = await Service.findByPk(id);
        if (!service) {
            return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
        }

        // Validate name
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Tên dịch vụ là bắt buộc' });
        }

        // Check duplicate name (exclude current service)
        const existing = await Service.findOne({
            where: {
                name: name.trim(),
                id: { [require('sequelize').Op.ne]: id }
            }
        });
        if (existing) {
            return res.status(400).json({ message: 'Tên dịch vụ đã tồn tại' });
        }

        await service.update({
            name: name.trim(),
            description: description?.trim() || null,
            price: price || 0,
            duration: duration || null,
            specialty_id: specialty_id || null
        });

        console.log(`✅ Updated service: ${service.name}`);
        res.json({
            message: 'Cập nhật dịch vụ thành công',
            service
        });
    } catch (error) {
        console.error('❌ Error updating service:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// DELETE - Xóa dịch vụ
exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📋 Admin: DELETE service ${id}`);

        const service = await Service.findByPk(id);
        if (!service) {
            return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
        }

        // Check if service is being used in bookings
        const { Booking } = require('../models');
        const bookingCount = await Booking.count({ where: { service_id: id } });

        if (bookingCount > 0) {
            return res.status(400).json({
                message: `Không thể xóa dịch vụ này vì đang có ${bookingCount} lịch hẹn liên quan`
            });
        }

        const serviceName = service.name;
        await service.destroy();

        console.log(`✅ Deleted service: ${serviceName}`);
        res.json({ message: 'Xóa dịch vụ thành công' });
    } catch (error) {
        console.error('❌ Error deleting service:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// GET - Thống kê dịch vụ
exports.getServiceStats = async (req, res) => {
    try {
        console.log('📊 Admin: GET service stats');

        const totalServices = await Service.count();

        const services = await Service.findAll({ attributes: ['price', 'specialty_id'] });

        const avgPrice = services.length > 0
            ? Math.round(services.reduce((sum, s) => sum + Number(s.price || 0), 0) / services.length)
            : 0;

        const specialtyCount = [...new Set(services.map(s => s.specialty_id))].filter(Boolean).length;

        res.json({
            totalServices,
            avgPrice,
            specialtyCount
        });
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
