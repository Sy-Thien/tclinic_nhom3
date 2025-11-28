const { Booking, Patient, Doctor, Specialty, Prescription, PrescriptionDetail, Drug } = require('../models');
const { Op } = require('sequelize');

// Patient - Lấy lịch sử khám bệnh của mình
exports.getMyMedicalHistory = async (req, res) => {
    try {
        const patient_id = req.user.id;

        const records = await Booking.findAll({
            where: {
                patient_id,
                status: 'completed'
            },
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name', 'phone'],
                    include: [{
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    }]
                },
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                },
                {
                    model: Prescription,
                    as: 'prescription',
                    include: [{
                        model: PrescriptionDetail,
                        as: 'details',
                        include: [{
                            model: Drug,
                            as: 'drug',
                            attributes: ['id', 'name', 'ingredient', 'unit']
                        }]
                    }]
                }
            ],
            order: [['appointment_date', 'DESC']]
        });

        res.json({
            success: true,
            message: 'Lấy lịch sử khám thành công',
            data: records
        });

    } catch (error) {
        console.error('❌ Get medical history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Patient - Lấy chi tiết một lần khám
exports.getMedicalRecordDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const patient_id = req.user.id;

        const record = await Booking.findOne({
            where: {
                id,
                patient_id,
                status: 'completed'
            },
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name', 'phone', 'email'],
                    include: [{
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    }]
                },
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                },
                {
                    model: Prescription,
                    as: 'prescription',
                    include: [{
                        model: PrescriptionDetail,
                        as: 'details',
                        include: [{
                            model: Drug,
                            as: 'drug',
                            attributes: ['id', 'name', 'ingredient', 'unit', 'usage']
                        }]
                    }]
                }
            ]
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bệnh án'
            });
        }

        res.json({
            success: true,
            message: 'Lấy chi tiết bệnh án thành công',
            data: record
        });

    } catch (error) {
        console.error('❌ Get medical record detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Doctor - Lấy lịch sử khám của bệnh nhân (khi đang khám)
exports.getPatientMedicalHistory = async (req, res) => {
    try {
        const { patient_id } = req.params;

        const records = await Booking.findAll({
            where: {
                patient_id,
                status: 'completed'
            },
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name']
                },
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            order: [['appointment_date', 'DESC']],
            limit: 10
        });

        res.json({
            success: true,
            message: 'Lấy lịch sử khám thành công',
            data: records
        });

    } catch (error) {
        console.error('❌ Get patient history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = exports;
