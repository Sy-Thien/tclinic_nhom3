import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

/**
 * Tạo PDF toa thuốc
 * @param {Object} prescription - Thông tin đơn thuốc từ API
 * @param {Object} appointment - Thông tin lịch hẹn
 * @param {Object} doctor - Thông tin bác sĩ
 */
export const generatePrescriptionPDF = (prescription, appointment, doctor) => {
    const currentDate = new Date().toLocaleDateString('vi-VN');

    // Tạo danh sách thuốc cho PDF
    const drugTableBody = [
        [
            { text: 'STT', bold: true, alignment: 'center' },
            { text: 'Tên Thuốc', bold: true, alignment: 'center' },
            { text: 'Hoạt Chất', bold: true, alignment: 'center' },
            { text: 'Số Lượng', bold: true, alignment: 'center' },
            { text: 'Liều Lượng', bold: true, alignment: 'center' },
            { text: 'Thời Gian Dùng', bold: true, alignment: 'center' },
            { text: 'Ghi Chú', bold: true, alignment: 'center' }
        ]
    ];

    // Thêm từng dòng thuốc
    prescription.PrescriptionDetails?.forEach((detail, index) => {
        drugTableBody.push([
            { text: (index + 1).toString(), alignment: 'center' },
            { text: detail.Drug?.name || '' },
            { text: detail.Drug?.ingredient || '', fontSize: 9 },
            { text: `${detail.quantity} ${detail.unit}`, alignment: 'center' },
            { text: detail.dosage || '', alignment: 'center' },
            { text: detail.duration || '', alignment: 'center' },
            { text: detail.note || '', fontSize: 8 }
        ]);
    });

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 60],

        header: {
            text: 'PHÒNG KHÁM ĐA KHOA TNCLINIC',
            alignment: 'center',
            fontSize: 14,
            bold: true,
            margin: [0, 20, 0, 10]
        },

        content: [
            // TIÊU ĐỀ
            {
                text: 'TƠA THUỐC',
                alignment: 'center',
                fontSize: 16,
                bold: true,
                margin: [0, 10, 0, 20]
            },

            // MÃ TƠA
            {
                text: `Mã tơa: ${prescription.prescription_code || 'N/A'}`,
                fontSize: 10,
                margin: [0, 0, 0, 15]
            },

            // THÔNG TIN BỆNH NHÂN
            {
                text: 'I. THÔNG TIN BỆNH NHÂN',
                fontSize: 11,
                bold: true,
                margin: [0, 0, 0, 10],
                decoration: 'underline'
            },
            {
                columns: [
                    {
                        width: '50%',
                        stack: [
                            { text: `Họ tên: ${appointment?.patient_name || ''}`, fontSize: 10 },
                            { text: `Ngày sinh: ${appointment?.patient_dob || ''}`, fontSize: 10, margin: [0, 5, 0, 0] },
                            { text: `Giới tính: ${appointment?.patient_gender === 'male' ? 'Nam' : 'Nữ'}`, fontSize: 10, margin: [0, 5, 0, 0] }
                        ]
                    },
                    {
                        width: '50%',
                        stack: [
                            { text: `SĐT: ${appointment?.patient_phone || ''}`, fontSize: 10 },
                            { text: `Email: ${appointment?.patient_email || ''}`, fontSize: 10, margin: [0, 5, 0, 0] },
                            { text: `Địa chỉ: ${appointment?.patient_address || ''}`, fontSize: 10, margin: [0, 5, 0, 0] }
                        ]
                    }
                ],
                margin: [0, 0, 0, 15]
            },

            // THÔNG TIN KHÁM
            {
                text: 'II. THÔNG TIN KHÁM',
                fontSize: 11,
                bold: true,
                margin: [0, 0, 0, 10],
                decoration: 'underline'
            },
            {
                columns: [
                    {
                        width: '50%',
                        stack: [
                            { text: `Ngày khám: ${appointment?.appointment_date || ''}`, fontSize: 10 },
                            { text: `Giờ khám: ${appointment?.appointment_time || ''}`, fontSize: 10, margin: [0, 5, 0, 0] }
                        ]
                    },
                    {
                        width: '50%',
                        stack: [
                            { text: `Chuyên khoa: ${appointment?.specialty?.name || ''}`, fontSize: 10 },
                            { text: `Bác sĩ: ${doctor?.full_name || appointment?.doctor_name || 'N/A'}`, fontSize: 10, margin: [0, 5, 0, 0] }
                        ]
                    }
                ],
                margin: [0, 0, 0, 15]
            },

            // TRIỆU CHỨNG
            {
                text: 'III. TRIỆU CHỨNG BAN ĐẦU',
                fontSize: 11,
                bold: true,
                margin: [0, 0, 0, 10],
                decoration: 'underline'
            },
            {
                text: appointment?.symptoms || 'Không có',
                fontSize: 10,
                margin: [0, 0, 0, 15],
                alignment: 'justify'
            },

            // CHẨN ĐOÁN
            {
                text: 'IV. CHẨN ĐOÁN',
                fontSize: 11,
                bold: true,
                margin: [0, 0, 0, 10],
                decoration: 'underline'
            },
            {
                text: appointment?.diagnosis || 'Không có',
                fontSize: 10,
                margin: [0, 0, 0, 15],
                alignment: 'justify'
            },

            // DANH SÁCH THUỐC
            {
                text: 'V. TƠA THUỐC',
                fontSize: 11,
                bold: true,
                margin: [0, 0, 0, 10],
                decoration: 'underline'
            },
            {
                table: {
                    headerRows: 1,
                    widths: ['5%', '20%', '18%', '12%', '15%', '15%', '*'],
                    body: drugTableBody
                },
                layout: {
                    fillColor: (rowIndex) => rowIndex === 0 ? '#E8EAED' : null,
                    hLineColor: '#CCCCCC',
                    vLineColor: '#CCCCCC',
                    hLineWidth: 0.5,
                    vLineWidth: 0.5,
                    paddingLeft: 5,
                    paddingRight: 5,
                    paddingTop: 8,
                    paddingBottom: 8
                },
                margin: [0, 0, 0, 15]
            },

            // HƯỚNG DẪN DÙNG THUỐC
            {
                text: 'VI. HƯỚNG DẪN DÙNG THUỐC',
                fontSize: 11,
                bold: true,
                margin: [0, 0, 0, 10],
                decoration: 'underline'
            },
            {
                ul: [
                    'Uống thuốc đầy đủ theo đơn, không tự ý bỏ thuốc hoặc giảm liều',
                    'Uống thuốc đúng giờ, đúng liều lượng theo hướng dẫn',
                    'Uống thuốc cùng với nước lạnh, không uống với rượu bia',
                    'Nếu có dị ứng hoặc tác dụng phụ, hãy liên hệ ngay phòng khám',
                    'Bảo quản thuốc ở nơi thoáng, mát, tránh ánh sáng trực tiếp'
                ],
                fontSize: 9,
                margin: [0, 0, 0, 20]
            },

            // GƯƠNG TUI CHUNG
            prescription.note ? {
                text: `Ghi Chú: ${prescription.note}`,
                fontSize: 10,
                margin: [0, 0, 0, 20],
                italics: true,
                color: '#666666'
            } : { text: '', margin: 0 },

            // KẾT LUẬN
            {
                text: 'VII. KẾT LUẬN',
                fontSize: 11,
                bold: true,
                margin: [0, 0, 0, 10],
                decoration: 'underline'
            },
            {
                text: appointment?.conclusion || 'Không có',
                fontSize: 10,
                margin: [0, 0, 0, 30],
                alignment: 'justify'
            },

            // CHỮ KÝ
            {
                columns: [
                    {
                        width: '60%',
                        text: ''
                    },
                    {
                        width: '40%',
                        stack: [
                            { text: 'Ngày: ' + currentDate, fontSize: 10, margin: [0, 0, 0, 30] },
                            { text: 'Bác sĩ:', fontSize: 10, bold: true, margin: [0, 0, 0, 50] },
                            { text: doctor?.full_name || appointment?.doctor_name || 'N/A', fontSize: 10, alignment: 'center' }
                        ]
                    }
                ]
            }
        ],

        footer: {
            text: '© PHÒNG KHÁM ĐA KHOA TNCLINIC - Địa chỉ: Hà Nội, Việt Nam',
            alignment: 'center',
            fontSize: 8,
            color: '#999999',
            margin: [0, 10, 0, 0]
        }
    };

    // Tạo và download PDF
    const fileName = `ToaThuoc_${prescription.prescription_code}_${new Date().getTime()}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
};

export default generatePrescriptionPDF;
