const { MedicalHistory, Patient, Doctor, Booking, Prescription, PrescriptionDetail, Drug, Specialty, Service } = require('../Database/Entity');
const { Op } = require('sequelize');

// Lưu lịch sử khám bệnh khi bác sĩ hoàn thành khám

class MedicalHistoryController {
        async saveMedicalHistory(req, res) {
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
    // ✅ CHỈ trả về những lần khám mà BÁC SĨ HIỆN TẠI đã khám
        async getPatientHistory(req, res) {
        try {
            const { patient_id } = req.params;
            const doctor_id = req.user.id;

            // ✅ Lấy thông tin từ booking gần nhất của bác sĩ với bệnh nhân này
            const latestBooking = await Booking.findOne({
                where: {
                    patient_id,
                    doctor_id
                },
                order: [['appointment_date', 'DESC']],
                include: [
                    {
                        model: Patient,
                        as: 'patient',
                        attributes: ['id', 'full_name', 'phone', 'email', 'gender', 'birthday', 'address']
                    }
                ]
            });

            if (!latestBooking) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chưa từng khám bệnh nhân này nên không có quyền xem hồ sơ'
                });
            }

            // ✅ Ưu tiên lấy thông tin từ booking (patient_name) thay vì Patient table
            const patient = {
                id: latestBooking.patient?.id || patient_id,
                full_name: latestBooking.patient_name || latestBooking.patient?.full_name || 'N/A',
                phone: latestBooking.patient_phone || latestBooking.patient?.phone || '',
                email: latestBooking.patient_email || latestBooking.patient?.email || '',
                gender: latestBooking.patient_gender || latestBooking.patient?.gender || '',
                birthday: latestBooking.patient_dob || latestBooking.patient?.birthday || null,
                address: latestBooking.patient_address || latestBooking.patient?.address || ''
            };

            // ✅ Lấy lịch sử khám của bác sĩ hiện tại với bệnh nhân này
            const histories = await MedicalHistory.findAll({
                where: {
                    patient_id,
                    doctor_id  // ✅ Chỉ lấy record của bác sĩ đang đăng nhập
                },
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
                        model: Booking,
                        as: 'booking',
                        attributes: ['id', 'service_id'],
                        include: [
                            { model: Service, as: 'service', attributes: ['id', 'name', 'price'] }
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
                                    { model: Drug, as: 'drug', attributes: ['id', 'name', 'unit', 'ingredient', 'price'] }
                                ]
                            }
                        ]
                    }
                ],
                order: [['visit_date', 'DESC'], ['visit_time', 'DESC']]
            });

            // ✅ Cũng lấy booking completed có diagnosis (dù chưa có MedicalHistory record)
            const completedBookings = await Booking.findAll({
                where: {
                    patient_id,
                    doctor_id,
                    status: 'completed',
                    diagnosis: { [Op.ne]: null }
                },
                include: [
                    { model: Service, as: 'service', attributes: ['id', 'name', 'price'] },
                    { model: Specialty, as: 'specialty', attributes: ['id', 'name'] },
                    {
                        model: Prescription,
                        as: 'prescription',
                        include: [
                            {
                                model: PrescriptionDetail,
                                as: 'details',
                                include: [
                                    { model: Drug, as: 'drug', attributes: ['id', 'name', 'unit', 'ingredient', 'price'] }
                                ]
                            }
                        ]
                    }
                ],
                order: [['appointment_date', 'DESC']]
            });

            // ✅ Merge: booking completed chưa có history
            const historyBookingIds = histories.map(h => h.booking_id);
            const additionalHistories = completedBookings
                .filter(b => !historyBookingIds.includes(b.id))
                .map(b => ({
                    id: `booking_${b.id}`,
                    booking_id: b.id,
                    patient_id: b.patient_id,
                    doctor_id: b.doctor_id,
                    visit_date: b.appointment_date,
                    visit_time: b.appointment_time,
                    symptoms: b.symptoms,
                    diagnosis: b.diagnosis,
                    conclusion: b.conclusion,
                    note: b.note,
                    booking: b,
                    prescription: b.prescription, // ✅ Thêm prescription
                    isFromBooking: true // Flag để frontend biết đây là từ booking
                }));

            const allHistories = [...histories, ...additionalHistories]
                .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

            // ✅ Trả về kết quả (có thể rỗng nếu chưa hoàn thành khám)
            res.json({
                success: true,
                patient,
                totalVisits: allHistories.length,
                histories: allHistories
            });

        } catch (error) {
            console.error('❌ Get patient history error:', error);
            res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    };

    // Xem chi tiết 1 lần khám
        async getHistoryDetail(req, res) {
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
                        attributes: ['id', 'booking_code', 'status', 'service_id'],
                        include: [
                            { model: Service, as: 'service', attributes: ['id', 'name', 'price'] }
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
                                    { model: Drug, as: 'drug', attributes: ['id', 'name', 'unit', 'ingredient', 'price'] }
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
        async getMyPatients(req, res) {
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

}

module.exports = new MedicalHistoryController();



