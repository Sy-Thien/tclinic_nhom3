const { ConsultationRequest, Patient, Specialty, Doctor } = require('../Database/Entity');

// Customer - Tạo yêu cầu tư vấn mới

class ConsultationRequestController {
        async createRequest(req, res) {
        try {
            const { subject, message, category, specialty_id } = req.body;
            const patient_id = req.user?.id || null; // NULL nếu là guest

            // Guest user phải cung cấp thông tin
            let guest_name = null, guest_email = null, guest_phone = null;
            if (!patient_id) {
                guest_name = req.body.guest_name;
                guest_email = req.body.guest_email;
                guest_phone = req.body.guest_phone;

                if (!guest_name || !guest_email) {
                    return res.status(400).json({
                        message: 'Vui lòng cung cấp tên và email!'
                    });
                }
            }

            const request = await ConsultationRequest.create({
                patient_id,
                guest_name,
                guest_email,
                guest_phone,
                subject,
                message,
                category: category || 'general',
                specialty_id: specialty_id || null,
                status: 'pending',
                priority: 'medium'
            });

            console.log('✅ Consultation request created:', request.id);

            res.status(201).json({
                success: true,
                message: 'Gửi yêu cầu thành công! Chúng tôi sẽ phản hồi sớm nhất.',
                data: request
            });

        } catch (error) {
            console.error('❌ Create consultation request error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // Customer - Xem lịch sử yêu cầu của mình
        async getMyRequests(req, res) {
        try {
            const patient_id = req.user.id;

            const requests = await ConsultationRequest.findAll({
                where: { patient_id },
                include: [
                    {
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    },
                    {
                        model: Doctor,
                        as: 'assignedDoctor',
                        attributes: ['id', 'full_name', 'email', 'phone']
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            res.json({
                success: true,
                data: requests
            });

        } catch (error) {
            console.error('❌ Get my requests error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // Customer - Xem chi tiết 1 yêu cầu
        async getRequestDetail(req, res) {
        try {
            const { id } = req.params;
            const patient_id = req.user.id;

            const request = await ConsultationRequest.findOne({
                where: { id, patient_id },
                include: [
                    {
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    },
                    {
                        model: Doctor,
                        as: 'assignedDoctor',
                        attributes: ['id', 'full_name', 'email', 'phone', 'specialty_id'],
                        include: [{
                            model: Specialty,
                            as: 'specialty',
                            attributes: ['name']
                        }]
                    }
                ]
            });

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy yêu cầu'
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

}

module.exports = new ConsultationRequestController();



