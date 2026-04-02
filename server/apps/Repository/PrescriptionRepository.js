const BaseRepository = require('./BaseRepository');
const { Prescription, PrescriptionDetail, Drug, Doctor, Patient, Booking } = require('../Database/Entity');

class PrescriptionRepository extends BaseRepository {
    constructor() {
        super(Prescription);
    }

    /**
     * Tìm prescription với đầy đủ thông tin
     * @param {number} id 
     */
    async findByIdWithDetails(id) {
        return await this.findById(id, {
            include: [
                { model: Doctor, as: 'doctor' },
                { model: Patient, as: 'patient' },
                { model: Booking, as: 'booking' },
                {
                    model: PrescriptionDetail,
                    as: 'details',
                    include: [{ model: Drug, as: 'drug' }]
                }
            ]
        });
    }

    /**
     * Lấy prescriptions của patient
     * @param {number} patientId 
     */
    async findByPatient(patientId) {
        return await this.findAll({
            where: { patient_id: patientId },
            include: [
                { model: Doctor, as: 'doctor' },
                { model: PrescriptionDetail, as: 'details', include: [{ model: Drug, as: 'drug' }] }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    /**
     * Lấy prescriptions của doctor
     * @param {number} doctorId 
     */
    async findByDoctor(doctorId) {
        return await this.findAll({
            where: { doctor_id: doctorId },
            include: [
                { model: Patient, as: 'patient' },
                { model: PrescriptionDetail, as: 'details' }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    /**
     * Tạo prescription với details
     * @param {Object} prescriptionData 
     * @param {Array} details 
     */
    async createWithDetails(prescriptionData, details) {
        const prescription = await this.create(prescriptionData);

        if (details && details.length > 0) {
            const detailsWithPrescriptionId = details.map(d => ({
                ...d,
                prescription_id: prescription.id
            }));
            await PrescriptionDetail.bulkCreate(detailsWithPrescriptionId);
        }

        return await this.findByIdWithDetails(prescription.id);
    }
}

module.exports = new PrescriptionRepository();
