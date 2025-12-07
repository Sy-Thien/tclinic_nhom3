const { Booking, Doctor, Specialty, Service, Invoice } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const moment = require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const sequelize = require('../config/database');

// Thống kê tổng quan
exports.getSummaryStats = async (req, res) => {
    try {
        const { from, to } = req.query;

        const where = {};
        if (from && to) {
            where.appointment_date = { [Op.between]: [from, to] };
        }

        // Tổng số booking
        const totalBookings = await Booking.count({ where });

        // Số booking theo trạng thái
        const completedBookings = await Booking.count({
            where: { ...where, status: 'completed' }
        });

        const cancelledBookings = await Booking.count({
            where: { ...where, status: 'cancelled' }
        });

        const pendingBookings = await Booking.count({
            where: { ...where, status: { [Op.in]: ['pending', 'confirmed', 'waiting_doctor_confirmation', 'waiting_doctor_assignment'] } }
        });

        // ✅ Tính doanh thu thực từ Invoice (đã thanh toán) - dùng DATE(created_at) để tránh timezone issue
        const invoiceWhere = { payment_status: 'paid' };
        if (from && to) {
            invoiceWhere[Op.and] = [
                literal(`DATE(created_at) >= '${from}'`),
                literal(`DATE(created_at) <= '${to}'`)
            ];
        }
        const revenueResult = await Invoice.findOne({
            attributes: [[fn('SUM', col('total_amount')), 'totalRevenue']],
            where: invoiceWhere,
            raw: true
        });
        const totalRevenue = parseFloat(revenueResult?.totalRevenue) || 0;

        // Tính số ngày trong khoảng thời gian
        let dayCount = 30;
        if (from && to) {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            dayCount = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
        }

        const avgPerDay = dayCount > 0 ? Math.round(totalBookings / dayCount) : 0;
        const avgRevenuePerDay = dayCount > 0 ? Math.round(totalRevenue / dayCount) : 0;

        res.json({
            totalBookings,
            completedBookings,
            cancelledBookings,
            pendingBookings,
            avgPerDay,
            totalRevenue,
            avgRevenuePerDay
        });
    } catch (error) {
        console.error('Error getting summary stats:', error);
        res.status(500).json({ message: 'Lỗi thống kê tổng quan', error: error.message });
    }
};

// ✅ NEW: Thống kê doanh thu theo ngày/tháng (từ Invoice)
exports.getRevenueStats = async (req, res) => {
    try {
        const { type = 'day', from, to } = req.query;

        let groupFormat;
        if (type === 'day') {
            groupFormat = '%Y-%m-%d';
        } else if (type === 'month') {
            groupFormat = '%Y-%m';
        } else {
            groupFormat = '%Y-%m-%d';
        }

        // Dùng DATE(created_at) để tránh timezone issue
        const where = { payment_status: 'paid' };
        if (from && to) {
            where[Op.and] = [
                literal(`DATE(created_at) >= '${from}'`),
                literal(`DATE(created_at) <= '${to}'`)
            ];
        }

        // Lấy doanh thu từ Invoice - group by DATE(created_at)
        const stats = await Invoice.findAll({
            attributes: [
                [fn('DATE_FORMAT', col('created_at'), groupFormat), 'period'],
                [fn('COUNT', col('id')), 'count'],
                [fn('SUM', col('total_amount')), 'revenue']
            ],
            where,
            group: [literal('period')],
            order: [[literal('period'), 'ASC']],
            raw: true
        });

        // Format lại data
        const formattedStats = stats.map(item => ({
            period: item.period,
            label: type === 'day'
                ? moment(item.period).format('DD/MM')
                : moment(item.period + '-01').format('MM/YYYY'),
            count: parseInt(item.count) || 0,
            revenue: parseFloat(item.revenue) || 0
        }));

        // Tính tổng
        const totalRevenue = formattedStats.reduce((sum, item) => sum + item.revenue, 0);
        const totalCount = formattedStats.reduce((sum, item) => sum + item.count, 0);

        res.json({
            data: formattedStats,
            summary: {
                totalRevenue,
                totalCount,
                avgRevenue: formattedStats.length > 0 ? Math.round(totalRevenue / formattedStats.length) : 0
            }
        });
    } catch (error) {
        console.error('Error in getRevenueStats:', error);
        res.status(500).json({ message: 'Lỗi thống kê doanh thu', error: error.message });
    }
};

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
                [fn('COUNT', col('Booking.id')), 'count']
            ],
            where,
            group: [literal('period')],
            order: [[literal('period'), 'ASC']],
            raw: true
        });

        res.json(stats);
    } catch (error) {
        console.error('Error in getVisitStats:', error);
        res.status(500).json({ message: 'Lỗi thống kê lượt khám', error: error.message });
    }
};

// Bác sĩ khám nhiều nhất
exports.getTopDoctors = async (req, res) => {
    try {
        const { from, to, limit = 5 } = req.query;
        const where = { doctor_id: { [Op.ne]: null } };
        if (from && to) {
            where.appointment_date = { [Op.between]: [from, to] };
        }
        where.status = 'completed';

        const stats = await Booking.findAll({
            attributes: [
                'doctor_id',
                [fn('COUNT', col('Booking.id')), 'count']
            ],
            where,
            group: ['doctor_id', 'doctor.id', 'doctor.full_name'],
            order: [[literal('count'), 'DESC']],
            limit: parseInt(limit),
            include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'full_name'] }],
            raw: false
        });

        res.json(stats);
    } catch (error) {
        console.error('Error in getTopDoctors:', error);
        res.status(500).json({ message: 'Lỗi thống kê bác sĩ', error: error.message });
    }
};

// Loại bệnh phổ biến (theo specialty)
exports.getPopularSpecialties = async (req, res) => {
    try {
        const { from, to, limit = 5 } = req.query;
        const where = { specialty_id: { [Op.ne]: null } };
        if (from && to) {
            where.appointment_date = { [Op.between]: [from, to] };
        }
        where.status = 'completed';

        const stats = await Booking.findAll({
            attributes: [
                'specialty_id',
                [fn('COUNT', col('Booking.id')), 'count']
            ],
            where,
            group: ['specialty_id', 'specialty.id', 'specialty.name'],
            order: [[literal('count'), 'DESC']],
            limit: parseInt(limit),
            include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }],
            raw: false
        });

        res.json(stats);
    } catch (error) {
        console.error('Error in getPopularSpecialties:', error);
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
