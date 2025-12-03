const { ConsultationRequest, Patient, Specialty } = require('../models');

// Doctor - Lấy danh sách yêu cầu được assign
exports.getMyAssignedRequests = async (req, res) => {
    try {
        const doctor_id = req.user.doctor_id || req.user.id;
        const { status } = req.query;

        const where = { assigned_doctor_id: doctor_id };
        if (status) where.status = status;

        const requests = await ConsultationRequest.findAll({
            where,
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'email', 'phone', 'birthday', 'gender']
                },
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            order: [
                ['priority', 'DESC'],
                ['assigned_at', 'DESC']
            ]
        });

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('❌ Get doctor assigned requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Doctor - Xem chi tiết yêu cầu
exports.getRequestDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor_id = req.user.doctor_id || req.user.id;

        const request = await ConsultationRequest.findOne({
            where: { id, assigned_doctor_id: doctor_id },
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'email', 'phone', 'birthday', 'gender', 'address']
                },
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu hoặc không có quyền truy cập'
            });
        }

        res.json({
            success: true,
            data: request
        });

    } catch (error) {
        console.error('❌ Get request detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Doctor - Phản hồi tư vấn
exports.respondToRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctor_response, status } = req.body;
        const doctor_id = req.user.doctor_id || req.user.id;

        if (!doctor_response || doctor_response.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập nội dung phản hồi!'
            });
        }

        const request = await ConsultationRequest.findOne({
            where: { id, assigned_doctor_id: doctor_id }
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu hoặc không có quyền truy cập'
            });
        }

        await request.update({
            doctor_response,
            responded_at: new Date(),
            status: status || 'in_progress'
        });

        console.log(`✅ Doctor responded to consultation request #${id}`);

        res.json({
            success: true,
            message: 'Đã gửi phản hồi thành công!',
            data: request
        });

    } catch (error) {
        console.error('❌ Doctor respond error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Doctor - Đánh dấu hoàn thành
exports.markAsResolved = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor_id = req.user.doctor_id || req.user.id;

        const request = await ConsultationRequest.findOne({
            where: { id, assigned_doctor_id: doctor_id }
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu'
            });
        }

        await request.update({
            status: 'resolved',
            resolved_at: new Date()
        });

        res.json({
            success: true,
            message: 'Đã đánh dấu hoàn thành!',
            data: request
        });

    } catch (error) {
        console.error('❌ Mark as resolved error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = exports;
