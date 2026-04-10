let pdfMakeLoaderPromise;

const loadPdfMake = async () => {
    if (pdfMakeLoaderPromise) {
        return pdfMakeLoaderPromise;
    }

    pdfMakeLoaderPromise = (async () => {
        const pdfMakeModule = await import('pdfmake/build/pdfmake');
        const pdfMake = pdfMakeModule.default || pdfMakeModule;

        let detectedVfs = null;
        try {
            const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
            const candidate = pdfFontsModule.default || pdfFontsModule;
            detectedVfs = candidate?.pdfMake?.vfs || candidate?.vfs || candidate;
        } catch (error) {
            console.error('Error loading pdfMake fonts:', error);
        }

        if (!pdfMake.vfs && detectedVfs) {
            pdfMake.vfs = detectedVfs;
        }

        if (!pdfMake.vfs && typeof window !== 'undefined' && window.pdfMake?.vfs) {
            pdfMake.vfs = window.pdfMake.vfs;
        }

        if (!pdfMake.vfs) {
            throw new Error('Không thể khởi tạo font cho PDF');
        }

        return pdfMake;
    })();

    return pdfMakeLoaderPromise;
};

/**
 * Tạo PDF toa thuốc
 * @param {Object} prescription - Thông tin đơn thuốc từ API
 * @param {Object} appointment - Thông tin lịch hẹn
 * @param {Object} doctor - Thông tin bác sĩ
 */
export const generatePrescriptionPDF = async (prescription, appointment, doctor) => {
    const currentDate = new Date().toLocaleDateString('vi-VN');

    // Tạo danh sách thuốc cho PDF - compact
    const drugTableBody = [
        [
            { text: 'STT', bold: true, alignment: 'center', fontSize: 9 },
            { text: 'Tên Thuốc', bold: true, fontSize: 9 },
            { text: 'SL', bold: true, alignment: 'center', fontSize: 9 },
            { text: 'Liều Dùng', bold: true, fontSize: 9 },
            { text: 'Ghi Chú', bold: true, fontSize: 9 }
        ]
    ];

    // Thêm từng dòng thuốc
    prescription.PrescriptionDetails?.forEach((detail, index) => {
        drugTableBody.push([
            { text: (index + 1).toString(), alignment: 'center', fontSize: 9 },
            { text: detail.Drug?.name || '', fontSize: 9 },
            { text: `${detail.quantity} ${detail.unit || ''}`.trim(), alignment: 'center', fontSize: 9 },
            { text: `${detail.dosage || ''} ${detail.duration ? `(${detail.duration})` : ''}`.trim(), fontSize: 9 },
            { text: detail.note || '', fontSize: 8 }
        ]);
    });

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [30, 30, 30, 40],

        content: [
            // HEADER
            {
                text: 'PHÒNG KHÁM ĐA KHOA TCLINIC',
                alignment: 'center',
                fontSize: 14,
                bold: true,
                margin: [0, 0, 0, 5]
            },
            {
                text: 'ĐƠN THUỐC',
                alignment: 'center',
                fontSize: 16,
                bold: true,
                margin: [0, 5, 0, 10]
            },
            {
                text: `Mã đơn: ${prescription.prescription_code || 'N/A'}`,
                fontSize: 9,
                alignment: 'right',
                margin: [0, 0, 0, 10]
            },

            // THÔNG TIN BỆNH NHÂN + KHÁM (gộp 2 cột)
            {
                columns: [
                    {
                        width: '50%',
                        stack: [
                            { text: 'THÔNG TIN BỆNH NHÂN', fontSize: 10, bold: true, decoration: 'underline', margin: [0, 0, 0, 5] },
                            { text: `Họ tên: ${appointment?.patient_name || ''}`, fontSize: 9 },
                            { text: `SĐT: ${appointment?.patient_phone || ''}`, fontSize: 9, margin: [0, 2, 0, 0] },
                            { text: `Giới tính: ${appointment?.patient_gender === 'male' ? 'Nam' : 'Nữ'}`, fontSize: 9, margin: [0, 2, 0, 0] }
                        ]
                    },
                    {
                        width: '50%',
                        stack: [
                            { text: 'THÔNG TIN KHÁM', fontSize: 10, bold: true, decoration: 'underline', margin: [0, 0, 0, 5] },
                            { text: `Ngày khám: ${appointment?.appointment_date || ''} ${appointment?.appointment_time || ''}`, fontSize: 9 },
                            { text: `Chuyên khoa: ${appointment?.specialty?.name || ''}`, fontSize: 9, margin: [0, 2, 0, 0] },
                            { text: `Bác sĩ: ${doctor?.full_name || appointment?.doctor_name || ''}`, fontSize: 9, margin: [0, 2, 0, 0] }
                        ]
                    }
                ],
                margin: [0, 0, 0, 10]
            },

            // TRIỆU CHỨNG + CHẨN ĐOÁN (gộp 1 dòng)
            {
                columns: [
                    { width: '50%', text: [{ text: 'Triệu chứng: ', bold: true, fontSize: 9 }, { text: appointment?.symptoms || 'Không có', fontSize: 9 }] },
                    { width: '50%', text: [{ text: 'Chẩn đoán: ', bold: true, fontSize: 9 }, { text: appointment?.diagnosis || 'Không có', fontSize: 9 }] }
                ],
                margin: [0, 0, 0, 10]
            },

            // DANH SÁCH THUỐC
            {
                text: 'DANH SÁCH THUỐC',
                fontSize: 10,
                bold: true,
                decoration: 'underline',
                margin: [0, 0, 0, 5]
            },
            {
                table: {
                    headerRows: 1,
                    widths: ['8%', '30%', '12%', '25%', '*'],
                    body: drugTableBody
                },
                layout: {
                    fillColor: function (rowIndex) { return rowIndex === 0 ? '#f0f0f0' : null; },
                    hLineColor: function () { return '#CCCCCC'; },
                    vLineColor: function () { return '#CCCCCC'; },
                    hLineWidth: function () { return 0.5; },
                    vLineWidth: function () { return 0.5; },
                    paddingLeft: function () { return 4; },
                    paddingRight: function () { return 4; },
                    paddingTop: function () { return 4; },
                    paddingBottom: function () { return 4; }
                },
                margin: [0, 0, 0, 10]
            },

            // GHI CHÚ (nếu có)
            prescription.note ? {
                text: [{ text: 'Ghi chú: ', bold: true, fontSize: 9 }, { text: prescription.note, fontSize: 9, italics: true }],
                margin: [0, 0, 0, 8]
            } : { text: '' },

            // HƯỚNG DẪN SỬ DỤNG (rút gọn)
            {
                text: 'HƯỚNG DẪN SỬ DỤNG THUỐC',
                fontSize: 10,
                bold: true,
                decoration: 'underline',
                margin: [0, 0, 0, 5]
            },
            {
                ul: [
                    'Uống thuốc đúng giờ, đúng liều lượng theo chỉ định',
                    'Không tự ý ngừng thuốc hoặc thay đổi liều',
                    'Liên hệ bác sĩ ngay nếu có phản ứng bất thường'
                ],
                fontSize: 8,
                margin: [0, 0, 0, 10]
            },

            // KẾT LUẬN (nếu có)
            appointment?.conclusion ? {
                text: [{ text: 'Kết luận: ', bold: true, fontSize: 9 }, { text: appointment.conclusion, fontSize: 9 }],
                margin: [0, 0, 0, 15]
            } : { text: '', margin: [0, 0, 0, 15] },

            // CHỮ KÝ
            {
                columns: [
                    { width: '60%', text: '' },
                    {
                        width: '40%',
                        stack: [
                            { text: `Ngày ${currentDate}`, fontSize: 9, alignment: 'center' },
                            { text: 'Bác sĩ khám bệnh', fontSize: 9, bold: true, alignment: 'center', margin: [0, 5, 0, 25] },
                            { text: doctor?.full_name || appointment?.doctor_name || '', fontSize: 10, alignment: 'center', bold: true }
                        ]
                    }
                ]
            }
        ],

        footer: {
            text: '© Phòng Khám Đa Khoa TClinic - ĐT: (028) 1234 5678',
            alignment: 'center',
            fontSize: 8,
            color: '#888888',
            margin: [0, 10, 0, 0]
        }
    };

    // Tạo và download PDF
    try {
        const pdfMake = await loadPdfMake();
        const fileName = `DonThuoc_${prescription.prescription_code || 'RX'}_${new Date().getTime()}.pdf`;
        console.log('📄 Creating PDF:', fileName);
        pdfMake.createPdf(docDefinition).download(fileName);
        console.log('✅ PDF download initiated');
    } catch (error) {
        console.error('❌ Error creating PDF:', error);
        throw error;
    }
};

export default generatePrescriptionPDF;
