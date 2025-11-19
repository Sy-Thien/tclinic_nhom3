const { Booking, Doctor, Specialty } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const moment = require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Số lượt khám theo ngày/tuần/tháng
exports.getVisitStats = async (req, res) => {
    try {
        const { type = 'day', from, to } = req.query;
        let groupFormat;
        if (type === 'day') groupFormat = '%Y-%m-%d';
        else if (type === 'week') groupFormat = '%Y-%u';
        else if (type === 'month') groupFormat = '%Y-%m';
        else groupFormat = '%Y-%m-%d';

        const where = {};
        if (from && to) {
            where.appointment_date = { [Op.between]: [from, to] };
        }

        const stats = await Booking.findAll({
            attributes: [
                [fn('DATE_FORMAT', col('appointment_date'), groupFormat), 'period'],
                [fn('COUNT', col('id')), 'count']
            ],
            where,
            group: [literal('period')],
            order: [[literal('period'), 'ASC']]
        });

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi thống kê lượt khám', error: error.message });
    }
};

// Bác sĩ khám nhiều nhất
exports.getTopDoctors = async (req, res) => {
    try {
        const { from, to, limit = 5 } = req.query;
        const where = {};
        if (from && to) {
            where.appointment_date = { [Op.between]: [from, to] };
        }
        where.status = 'completed';

        const stats = await Booking.findAll({
            attributes: [
                'doctor_id',
                [fn('COUNT', col('id')), 'count']
            ],
            where,
            group: ['doctor_id'],
            order: [[fn('COUNT', col('id')), 'DESC']],
            limit: parseInt(limit),
            include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'full_name'] }]
        });

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi thống kê bác sĩ', error: error.message });
    }
};

// Loại bệnh phổ biến (theo specialty)
exports.getPopularSpecialties = async (req, res) => {
    try {
        const { from, to, limit = 5 } = req.query;
        const where = {};
        if (from && to) {
            where.appointment_date = { [Op.between]: [from, to] };
        }
        where.status = 'completed';

        const stats = await Booking.findAll({
            attributes: [
                'specialty_id',
                [fn('COUNT', col('id')), 'count']
            ],
            where,
            group: ['specialty_id'],
            order: [[fn('COUNT', col('id')), 'DESC']],
            limit: parseInt(limit),
            include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }]
        });

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi thống kê chuyên khoa', error: error.message });
    }
};

// Xuất báo cáo Excel
exports.exportExcel = async (req, res) => {
    try {
        const { type = 'day', from, to } = req.query;
        // Lấy dữ liệu thống kê
        let groupFormat;
        if (type === 'day') groupFormat = '%Y-%m-%d';
        else if (type === 'week') groupFormat = '%Y-%u';
        else if (type === 'month') groupFormat = '%Y-%m';
        else groupFormat = '%Y-%m-%d';

        const where = {};
        if (from && to) {
            where.appointment_date = { [Op.between]: [from, to] };
        }

        const stats = await Booking.findAll({
            attributes: [
                [fn('DATE_FORMAT', col('appointment_date'), groupFormat), 'period'],
                [fn('COUNT', col('id')), 'count']
            ],
            where,
            group: [literal('period')],
            order: [[literal('period'), 'ASC']]
        });

        // Tạo file Excel
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Thống kê lượt khám');
        sheet.columns = [
            { header: 'Thời gian', key: 'period', width: 20 },
            { header: 'Số lượt khám', key: 'count', width: 15 }
        ];
        stats.forEach(row => sheet.addRow(row.dataValues));

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xuất báo cáo Excel', error: error.message });
    }
};

// Xuất báo cáo PDF
exports.exportPDF = async (req, res) => {
    try {
        const { type = 'day', from, to } = req.query;
        // Lấy dữ liệu thống kê
        let groupFormat;
        if (type === 'day') groupFormat = '%Y-%m-%d';
        else if (type === 'week') groupFormat = '%Y-%u';
        else if (type === 'month') groupFormat = '%Y-%m';
        else groupFormat = '%Y-%m-%d';

        const where = {};
        if (from && to) {
            where.appointment_date = { [Op.between]: [from, to] };
        }

        const stats = await Booking.findAll({
            attributes: [
                [fn('DATE_FORMAT', col('appointment_date'), groupFormat), 'period'],
                [fn('COUNT', col('id')), 'count']
            ],
            where,
            group: [literal('period')],
            order: [[literal('period'), 'ASC']]
        });

        // Tạo file PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
        doc.pipe(res);
        doc.fontSize(18).text('Thống kê lượt khám', { align: 'center' });
        doc.moveDown();
        stats.forEach(row => {
            doc.fontSize(12).text(`${row.dataValues.period}: ${row.dataValues.count} lượt khám`);
        });
        doc.end();
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xuất báo cáo PDF', error: error.message });
    }
};

module.exports = exports;
