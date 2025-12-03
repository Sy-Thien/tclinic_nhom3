const { ConsultationRequest, Patient, Specialty, Doctor, Admin } = require('../models');
const { Op } = require('sequelize');

// Admin - Lấy tất cả yêu cầu với filter
exports.getAllRequests = async (req, res) => {
    try {
        const { status, priority, specialty_id, search, page = 1, limit = 20 } = req.query;

        const where = {};

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (specialty_id) where.specialty_id = specialty_id;
        if (search) {
            where[Op.or] = [
                { subject: { [Op.like]: `%${search}%` } },
                { guest_name: { [Op.like]: `%${search}%` } },
                { guest_email: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await ConsultationRequest.findAndCountAll({
            where,
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'email', 'phone']
                },
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                },
                {
                    model: Doctor,
                    as: 'assignedDoctor',
                    attributes: ['id', 'full_name', 'email']
                },
                {
                    model: Admin,
                    as: 'assignedByAdmin',
                    attributes: ['id', 'username', 'full_name']
                }
            ],
            order: [
                ['priority', 'DESC'],  // urgent first
                ['created_at', 'DESC']
            ],
            limit: parseInt(limit),
            offset
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('❌ Get all consultation requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Admin - Thống kê dashboard
exports.getStats = async (req, res) => {
    try {
        const total = await ConsultationRequest.count();
        const pending = await ConsultationRequest.count({ where: { status: 'pending' } });
        const assigned = await ConsultationRequest.count({ where: { status: 'assigned' } });
        const inProgress = await ConsultationRequest.count({ where: { status: 'in_progress' } });
        const resolved = await ConsultationRequest.count({ where: { status: 'resolved' } });
        const closed = await ConsultationRequest.count({ where: { status: 'closed' } });

        const urgent = await ConsultationRequest.count({ where: { priority: 'urgent', status: { [Op.ne]: 'closed' } } });

        res.json({
            success: true,
            data: {
                total,
                pending,
                assigned,
                inProgress,
                resolved,
                closed,
                urgent
            }
        });

    } catch (error) {
        console.error('❌ Get consultation stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Admin - Chỉ định bác sĩ chuyên khoa
exports.assignDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctor_id, specialty_id, priority, admin_notes } = req.body;
        const admin_id = req.user.id;

        if (!doctor_id) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn bác sĩ!'
            });
        }

        const request = await ConsultationRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu'
            });
        }

        // Verify doctor exists
        const doctor = await Doctor.findByPk(doctor_id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bác sĩ'
            });
        }

        await request.update({
            assigned_doctor_id: doctor_id,
            specialty_id: specialty_id || doctor.specialty_id,
            assigned_by_admin_id: admin_id,
            assigned_at: new Date(),
            status: 'assigned',
            priority: priority || request.priority,
            admin_notes: admin_notes || request.admin_notes
        });

        const updatedRequest = await ConsultationRequest.findByPk(id, {
            include: [
                {
                    model: Doctor,
                    as: 'assignedDoctor',
                    attributes: ['id', 'full_name', 'email', 'phone']
                },
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ]
        });

        console.log(`✅ Admin assigned doctor ${doctor.full_name} to request #${id}`);

        res.json({
            success: true,
            message: 'Đã chỉ định bác sĩ thành công!',
            data: updatedRequest
        });

    } catch (error) {
        console.error('❌ Assign doctor error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Admin - Cập nhật trạng thái/priority
exports.updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, admin_notes } = req.body;

        const request = await ConsultationRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu'
            });
        }

        const updates = {};
        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (admin_notes !== undefined) updates.admin_notes = admin_notes;

        if (status === 'closed') {
            updates.resolved_at = new Date();
        }

        await request.update(updates);

        res.json({
            success: true,
            message: 'Cập nhật thành công!',
            data: request
        });

    } catch (error) {
        console.error('❌ Update request error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Admin - Xóa yêu cầu
exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await ConsultationRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu'
            });
        }

        await request.destroy();

        console.log('🗑️ Deleted consultation request:', id);

        res.json({
            success: true,
            message: 'Đã xóa yêu cầu!'
        });

    } catch (error) {
        console.error('❌ Delete request error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = exports;
