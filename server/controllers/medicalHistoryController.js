const { MedicalHistory, Patient, Doctor, Booking, Prescription, PrescriptionDetail, Drug, Specialty } = require('../models');

// Lưu lịch sử khám bệnh khi bác sĩ hoàn thành khám
exports.saveMedicalHistory = async (req, res) => {
    try {
        const { booking_id } = req.body;
        const doctor_id = req.user.id;

        // Lấy thông tin booking
        const booking = await Booking.findOne({
            where: { id: booking_id, doctor_id },
            include: [
                { model: Patient, as: 'patient', attributes: ['id', 'full_name'] }
            ]
        });

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch khám' });
        }

        // Kiểm tra đã có lịch sử chưa
        const existingHistory = await MedicalHistory.findOne({
            where: { booking_id }
        });

        if (existingHistory) {
            return res.status(400).json({ message: 'Bệnh án đã được lưu trước đó' });
        }

        // Lấy prescription_id nếu có
        const prescription = await Prescription.findOne({
            where: { booking_id }
        });

        // Tạo bản ghi lịch sử
        const history = await MedicalHistory.create({
            booking_id: booking.id,
            patient_id: booking.patient_id,
            doctor_id: doctor_id,
            visit_date: booking.appointment_date,
            visit_time: booking.appointment_time,
            symptoms: booking.symptoms,
            diagnosis: booking.diagnosis,
            conclusion: booking.conclusion,
            note: booking.note,
            prescription_id: prescription ? prescription.id : null
        });

        console.log('✅ Medical history saved:', history.id);

        res.json({
            success: true,
            message: 'Lưu bệnh án thành công',
            history
        });

    } catch (error) {
        console.error('❌ Save medical history error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Xem lịch sử khám bệnh của bệnh nhân (cho bác sĩ)
exports.getPatientHistory = async (req, res) => {
    try {
        const { patient_id } = req.params;
        const doctor_id = req.user.id;

        // Lấy thông tin bệnh nhân
        const patient = await Patient.findByPk(patient_id, {
            attributes: ['id', 'full_name', 'phone', 'email', 'gender', 'birthday', 'address']
        });

        if (!patient) {
            return res.status(404).json({ message: 'Không tìm thấy bệnh nhân' });
        }

        // Lấy lịch sử khám bệnh (tất cả các lần khám)
        const histories = await MedicalHistory.findAll({
            where: { patient_id },
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name'],
                    include: [
                        { model: Specialty, as: 'specialty', attributes: ['name'] }
                    ]
                },
                {
                    model: Prescription,
                    as: 'prescription',
                    include: [
                        {
                            model: PrescriptionDetail,
                            as: 'details',
                            include: [
                                { model: Drug, as: 'drug', attributes: ['name', 'unit'] }
                            ]
                        }
                    ]
                }
            ],
            order: [['visit_date', 'DESC'], ['visit_time', 'DESC']]
        });

        // Lấy các lần khám của bác sĩ hiện tại với bệnh nhân này
        const myHistories = histories.filter(h => h.doctor_id === doctor_id);

        res.json({
            success: true,
            patient,
            allHistories: histories.length,
            myVisits: myHistories.length,
            histories: histories
        });

    } catch (error) {
        console.error('❌ Get patient history error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Xem chi tiết 1 lần khám
exports.getHistoryDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const history = await MedicalHistory.findByPk(id, {
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'phone', 'email', 'gender', 'birthday', 'address']
                },
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name'],
                    include: [
                        { model: Specialty, as: 'specialty', attributes: ['name'] }
                    ]
                },
                {
                    model: Booking,
                    as: 'booking',
                    attributes: ['id', 'booking_code', 'status']
                },
                {
                    model: Prescription,
                    as: 'prescription',
                    include: [
                        {
                            model: PrescriptionDetail,
                            as: 'details',
                            include: [
                                { model: Drug, as: 'drug', attributes: ['name', 'unit'] }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!history) {
            return res.status(404).json({ message: 'Không tìm thấy bệnh án' });
        }

        res.json({
            success: true,
            history
        });

    } catch (error) {
        console.error('❌ Get history detail error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy danh sách bệnh nhân đã khám của bác sĩ
exports.getMyPatients = async (req, res) => {
    try {
        const doctor_id = req.user.id;

        // Lấy danh sách bệnh nhân unique từ lịch sử khám
        const histories = await MedicalHistory.findAll({
            where: { doctor_id },
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'phone', 'email', 'gender', 'birthday']
                }
            ],
            order: [['visit_date', 'DESC']]
        });

        // Group by patient_id và lấy thông tin lần khám gần nhất
        const patientsMap = new Map();
        histories.forEach(h => {
            if (!patientsMap.has(h.patient_id)) {
                patientsMap.set(h.patient_id, {
                    patient: h.patient,
                    lastVisit: h.visit_date,
                    totalVisits: 1
                });
            } else {
                const existing = patientsMap.get(h.patient_id);
                existing.totalVisits += 1;
            }
        });

        const patients = Array.from(patientsMap.values());

        res.json({
            success: true,
            total: patients.length,
            patients
        });

    } catch (error) {
        console.error('❌ Get my patients error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = exports;
