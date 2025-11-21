const { Prescription, PrescriptionDetail, Drug, Booking, Doctor, Patient } = require('../models');
const { Op } = require('sequelize');

// ✅ POST - Tạo đơn thuốc
exports.createPrescription = async (req, res) => {
    try {
        const { booking_id, patient_id, drugs, note } = req.body;
        const doctor_id = req.user.id;

        console.log('📝 POST /api/doctor/prescriptions', { booking_id, drugs: drugs?.length });

        if (!booking_id || !drugs || drugs.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ít nhất một loại thuốc'
            });
        }

        // Kiểm tra booking
        const booking = await Booking.findByPk(booking_id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch khám'
            });
        }

        // Tạo đơn thuốc
        const prescriptionCode = 'RX' + Date.now().toString().slice(-8);
        const prescription = await Prescription.create({
            booking_id,
            doctor_id,
            patient_id: patient_id || booking.patient_id,
            prescription_code: prescriptionCode,
            note: note || null
        });

        // Thêm chi tiết đơn thuốc và cập nhật tồn kho
        const details = [];
        for (const drug of drugs) {
            // Kiểm tra tồn kho
            const drugData = await Drug.findByPk(drug.drug_id);
            if (!drugData) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy thuốc (ID: ${drug.drug_id})`
                });
            }

            if (drugData.quantity < drug.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Thuốc "${drugData.name}" không đủ tồn kho. Có: ${drugData.quantity}, cần: ${drug.quantity}`
                });
            }

            // Tạo chi tiết đơn
            const detail = await PrescriptionDetail.create({
                prescription_id: prescription.id,
                drug_id: drug.drug_id,
                quantity: drug.quantity,
                unit: drug.unit || 'viên',
                dosage: drug.dosage || null,
                duration: drug.duration || null,
                note: drug.note || null
            });

            // Cập nhật tồn kho (giảm)
            await drugData.update({
                quantity: drugData.quantity - drug.quantity,
                updated_at: new Date()
            });

            details.push(detail);
        }

        // Fetch full prescription với details
        const fullPrescription = await Prescription.findByPk(prescription.id, {
            include: [
                {
                    model: PrescriptionDetail,
                    as: 'details',
                    include: [
                        {
                            model: Drug,
                            as: 'drug',
                            attributes: ['id', 'name', 'ingredient', 'unit']
                        }
                    ]
                },
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name']
                }
            ]
        });

        console.log(`✅ Prescription created: ${prescriptionCode}`);
        res.status(201).json({
            success: true,
            message: 'Kê đơn thuốc thành công',
            data: fullPrescription
        });
    } catch (error) {
        console.error('❌ Error creating prescription:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ GET - Danh sách đơn thuốc của bác sĩ
exports.getDoctorPrescriptions = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const { status } = req.query;
        console.log('📋 GET /api/doctor/prescriptions', { status });

        let where = { doctor_id };

        const prescriptions = await Prescription.findAll({
            where,
            include: [
                {
                    model: PrescriptionDetail,
                    as: 'details',
                    include: [
                        {
                            model: Drug,
                            as: 'drug',
                            attributes: ['id', 'name', 'ingredient']
                        }
                    ]
                },
                {
                    model: Booking,
                    as: 'booking',
                    attributes: ['id', 'booking_code', 'appointment_date', 'appointment_time', 'status']
                },
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'phone']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        console.log(`✅ Found ${prescriptions.length} prescriptions`);
        res.json({
            success: true,
            data: prescriptions,
            total: prescriptions.length
        });
    } catch (error) {
        console.error('❌ Error fetching prescriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ GET - Chi tiết đơn thuốc
exports.getPrescriptionById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📋 GET /api/doctor/prescriptions/${id}`);

        const prescription = await Prescription.findByPk(id, {
            include: [
                {
                    model: PrescriptionDetail,
                    as: 'details',
                    include: [
                        {
                            model: Drug,
                            as: 'drug',
                            attributes: ['id', 'name', 'ingredient', 'unit', 'price']
                        }
                    ]
                },
                {
                    model: Booking,
                    as: 'booking',
                    attributes: ['id', 'booking_code', 'appointment_date']
                },
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name']
                },
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'phone']
                }
            ]
        });

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn thuốc'
            });
        }

        console.log(`✅ Found prescription: ${prescription.prescription_code}`);
        res.json({
            success: true,
            data: prescription
        });
    } catch (error) {
        console.error('❌ Error fetching prescription:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ GET - Đơn thuốc của lịch khám cụ thể
exports.getPrescriptionByBookingId = async (req, res) => {
    try {
        const { bookingId } = req.params;
        console.log(`📋 GET /api/doctor/prescriptions/booking/${bookingId}`);

        const prescription = await Prescription.findOne({
            where: { booking_id: bookingId },
            include: [
                {
                    model: PrescriptionDetail,
                    as: 'details',
                    include: [
                        {
                            model: Drug,
                            as: 'drug',
                            attributes: ['id', 'name', 'ingredient', 'unit']
                        }
                    ]
                },
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name']
                }
            ]
        });

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Chưa có đơn thuốc cho lịch khám này'
            });
        }

        console.log(`✅ Found prescription for booking ${bookingId}`);
        res.json({
            success: true,
            data: prescription
        });
    } catch (error) {
        console.error('❌ Error fetching prescription:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// ✅ PUT - Cập nhật đơn thuốc
exports.updatePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        console.log(`📝 PUT /api/doctor/prescriptions/${id}`);

        const prescription = await Prescription.findByPk(id);
        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn thuốc'
            });
        }

        await prescription.update({
            note: note !== undefined ? note : prescription.note,
            updated_at: new Date()
        });

        console.log(`✅ Prescription updated: ${prescription.prescription_code}`);
        res.json({
            success: true,
            message: 'Cập nhật đơn thuốc thành công',
            data: prescription
        });
    } catch (error) {
        console.error('❌ Error updating prescription:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = exports;
