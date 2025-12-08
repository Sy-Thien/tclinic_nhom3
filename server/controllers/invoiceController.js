const { Invoice, InvoiceItem, Booking, Patient, Doctor, Service, Prescription, PrescriptionDetail, Drug } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Generate invoice code: INV-YYYYMMDD-XXXX
const generateInvoiceCode = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `INV-${dateStr}-`;

    // Find the latest invoice of today
    const latestInvoice = await Invoice.findOne({
        where: {
            invoice_code: {
                [Op.like]: `${prefix}%`
            }
        },
        order: [['id', 'DESC']]
    });

    let sequence = 1;
    if (latestInvoice) {
        const lastSeq = parseInt(latestInvoice.invoice_code.split('-').pop(), 10);
        sequence = lastSeq + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
};

// Create invoice from booking/prescription
exports.createInvoice = async (req, res) => {
    try {
        const { booking_id, prescription_id, payment_method, discount = 0, note } = req.body;

        console.log('📋 Creating invoice for booking:', booking_id);

        // Get booking info with service
        const booking = await Booking.findByPk(booking_id, {
            include: [
                {
                    model: Service,
                    as: 'service',
                    attributes: ['id', 'name', 'price']
                },
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name']
                },
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'phone', 'email']
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy booking' });
        }

        // Check if invoice already exists
        const existingInvoice = await Invoice.findOne({ where: { booking_id } });
        if (existingInvoice) {
            return res.status(400).json({
                message: 'Booking này đã có hóa đơn',
                invoice: existingInvoice
            });
        }

        // Calculate service fee from booking's service (mặc định 200,000đ nếu không có dịch vụ)
        const DEFAULT_EXAMINATION_FEE = 200000;
        const service_fee = Number(booking.service?.price) || DEFAULT_EXAMINATION_FEE;

        // Calculate drug fee from prescription
        let drug_fee = 0;
        let invoiceItems = [];

        if (prescription_id) {
            const prescription = await Prescription.findByPk(prescription_id, {
                include: [{
                    model: PrescriptionDetail,
                    as: 'details',
                    include: [{
                        model: Drug,
                        as: 'drug',
                        attributes: ['id', 'name', 'price', 'unit']
                    }]
                }]
            });

            if (prescription?.details) {
                for (const detail of prescription.details) {
                    const unitPrice = Number(detail.drug?.price) || 0;
                    const qty = Number(detail.quantity) || 0;
                    const itemTotal = unitPrice * qty;
                    drug_fee += itemTotal;

                    invoiceItems.push({
                        item_type: 'drug',
                        item_id: detail.drug_id,
                        item_name: detail.drug?.name || 'Unknown',
                        quantity: qty,
                        unit: detail.drug?.unit || 'viên',
                        unit_price: unitPrice,
                        total_price: itemTotal,
                        note: detail.dosage || ''
                    });
                }
            }
        }

        // Add service as invoice item (hoặc phí khám mặc định)
        invoiceItems.push({
            item_type: 'service',
            item_id: booking.service?.id || null,
            item_name: booking.service?.name || 'Phí khám tổng quát',
            quantity: 1,
            unit: 'lần',
            unit_price: service_fee,
            total_price: service_fee,
            note: booking.service ? 'Phí dịch vụ' : 'Phí khám mặc định'
        });

        const total_amount = Number(service_fee) + Number(drug_fee) - Number(discount || 0);
        const invoice_code = await generateInvoiceCode();

        // Create invoice
        const invoice = await Invoice.create({
            invoice_code,
            booking_id,
            patient_id: booking.patient_id,
            patient_name: booking.patient?.full_name || booking.patient_name,
            patient_phone: booking.patient?.phone || booking.patient_phone,
            doctor_id: booking.doctor_id,
            doctor_name: booking.doctor?.full_name || 'N/A',
            service_fee,
            drug_fee,
            other_fee: 0,
            discount,
            total_amount,
            payment_method: payment_method || 'cash',
            payment_status: 'pending',
            note: note || ''
        });

        // Create invoice items
        for (const item of invoiceItems) {
            await InvoiceItem.create({
                invoice_id: invoice.id,
                ...item
            });
        }

        console.log(`✅ Created invoice ${invoice_code} - Total: ${total_amount}`);

        res.status(201).json({
            message: 'Tạo hóa đơn thành công',
            invoice: {
                ...invoice.toJSON(),
                items: invoiceItems
            }
        });

    } catch (error) {
        console.error('❌ Error creating invoice:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status, payment_method, transaction_id } = req.body;

        const invoice = await Invoice.findByPk(id);
        if (!invoice) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }

        const updateData = { payment_status };
        if (payment_method) updateData.payment_method = payment_method;
        if (transaction_id) updateData.transaction_id = transaction_id;

        if (payment_status === 'paid' && !invoice.paid_at) {
            updateData.paid_at = new Date();
        }

        await invoice.update(updateData);

        // ✅ Tự động cập nhật booking thành completed khi thanh toán xong
        if (payment_status === 'paid' && invoice.booking_id) {
            const booking = await Booking.findByPk(invoice.booking_id);
            if (booking && booking.status !== 'completed') {
                await booking.update({ status: 'completed' });
                console.log(`✅ Booking ${booking.booking_code} marked as completed`);
            }
        }

        console.log(`✅ Updated invoice ${invoice.invoice_code} status to ${payment_status}`);

        res.json({ message: 'Cập nhật thành công', invoice });

    } catch (error) {
        console.error('❌ Error updating invoice:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Get invoice by booking ID
exports.getInvoiceByBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const invoice = await Invoice.findOne({
            where: { booking_id: bookingId },
            include: [{
                model: InvoiceItem,
                as: 'items'
            }]
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }

        res.json(invoice);

    } catch (error) {
        console.error('❌ Error fetching invoice:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Preview invoice data (before creating)
exports.previewInvoice = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { prescription_id } = req.query;

        console.log('👁️ Preview invoice for booking:', bookingId, 'prescription:', prescription_id);

        // Get booking with service
        const booking = await Booking.findByPk(bookingId, {
            include: [
                {
                    model: Service,
                    as: 'service',
                    attributes: ['id', 'name', 'price']
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy booking' });
        }

        // Calculate service fee (mặc định 200,000đ nếu không có dịch vụ)
        const DEFAULT_EXAMINATION_FEE = 200000;
        const service_fee = booking.service?.price || DEFAULT_EXAMINATION_FEE;
        const service_name = booking.service?.name || 'Phí khám tổng quát';

        // Calculate drug fee from prescription
        let drug_fee = 0;
        let items = [];

        // Add service as item (luôn có phí khám)
        items.push({
            item_type: 'service',
            item_id: booking.service?.id || null,
            item_name: service_name,
            quantity: 1,
            unit: 'lần',
            unit_price: service_fee,
            total_price: service_fee
        });

        // Get prescription details if provided
        if (prescription_id) {
            const prescription = await Prescription.findByPk(prescription_id, {
                include: [{
                    model: PrescriptionDetail,
                    as: 'details',
                    include: [{
                        model: Drug,
                        as: 'drug',
                        attributes: ['id', 'name', 'price', 'unit']
                    }]
                }]
            });

            if (prescription?.details) {
                for (const detail of prescription.details) {
                    const unitPrice = Number(detail.drug?.price) || 0;
                    const qty = Number(detail.quantity) || 0;
                    const itemTotal = unitPrice * qty;
                    drug_fee += itemTotal;

                    items.push({
                        item_type: 'drug',
                        item_id: detail.drug_id,
                        item_name: detail.drug?.name || 'Unknown',
                        quantity: qty,
                        unit: detail.drug?.unit || 'viên',
                        unit_price: unitPrice,
                        total_price: itemTotal
                    });
                }
            }
        }

        res.json({
            service_fee: Number(service_fee),
            service_name,
            drug_fee: Number(drug_fee),
            total: Number(service_fee) + Number(drug_fee),
            items
        });

    } catch (error) {
        console.error('❌ Error previewing invoice:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Get all invoices (admin)
exports.getAllInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, from_date, to_date, search } = req.query;
        const offset = (page - 1) * limit;

        const where = {};

        if (status) {
            where.payment_status = status;
        }

        if (from_date && to_date) {
            where.created_at = {
                [Op.between]: [new Date(from_date), new Date(to_date + 'T23:59:59')]
            };
        }

        if (search) {
            where[Op.or] = [
                { invoice_code: { [Op.like]: `%${search}%` } },
                { patient_name: { [Op.like]: `%${search}%` } },
                { patient_phone: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Invoice.findAndCountAll({
            where,
            include: [{
                model: InvoiceItem,
                as: 'items'
            }],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            invoices: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.error('❌ Error fetching invoices:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Get revenue statistics
exports.getRevenueStats = async (req, res) => {
    try {
        const { period = 'today' } = req.query;

        let startDate, endDate;
        const now = new Date();

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;
            case 'week':
                const dayOfWeek = now.getDay() || 7; // Sunday = 0 -> 7
                startDate = new Date(now);
                startDate.setDate(now.getDate() - dayOfWeek + 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        }

        // Total revenue (paid invoices)
        const totalRevenue = await Invoice.sum('total_amount', {
            where: {
                payment_status: 'paid',
                paid_at: { [Op.between]: [startDate, endDate] }
            }
        }) || 0;

        // Pending amount
        const pendingAmount = await Invoice.sum('total_amount', {
            where: {
                payment_status: 'pending',
                created_at: { [Op.between]: [startDate, endDate] }
            }
        }) || 0;

        // Count by status
        const statusCounts = await Invoice.findAll({
            attributes: [
                'payment_status',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total']
            ],
            where: {
                created_at: { [Op.between]: [startDate, endDate] }
            },
            group: ['payment_status'],
            raw: true
        });

        // Revenue by payment method (paid only)
        const byPaymentMethod = await Invoice.findAll({
            attributes: [
                'payment_method',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total']
            ],
            where: {
                payment_status: 'paid',
                paid_at: { [Op.between]: [startDate, endDate] }
            },
            group: ['payment_method'],
            raw: true
        });

        // Daily revenue for chart (last 7 days)
        const dailyRevenue = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

            const dayTotal = await Invoice.sum('total_amount', {
                where: {
                    payment_status: 'paid',
                    paid_at: { [Op.between]: [dayStart, dayEnd] }
                }
            }) || 0;

            dailyRevenue.push({
                date: dayStart.toISOString().slice(0, 10),
                label: `${date.getDate()}/${date.getMonth() + 1}`,
                total: dayTotal
            });
        }

        res.json({
            period,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalRevenue,
            pendingAmount,
            statusCounts,
            byPaymentMethod,
            dailyRevenue
        });

    } catch (error) {
        console.error('❌ Error fetching revenue stats:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Get invoice detail
exports.getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findByPk(id, {
            include: [{
                model: InvoiceItem,
                as: 'items'
            }]
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }

        res.json(invoice);

    } catch (error) {
        console.error('❌ Error fetching invoice:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Cancel invoice
exports.cancelInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const invoice = await Invoice.findByPk(id);
        if (!invoice) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }

        if (invoice.payment_status === 'paid') {
            return res.status(400).json({ message: 'Không thể hủy hóa đơn đã thanh toán' });
        }

        await invoice.update({
            payment_status: 'cancelled',
            note: invoice.note ? `${invoice.note}\n[Hủy] ${reason}` : `[Hủy] ${reason}`
        });

        console.log(`✅ Cancelled invoice ${invoice.invoice_code}`);

        res.json({ message: 'Hủy hóa đơn thành công', invoice });

    } catch (error) {
        console.error('❌ Error cancelling invoice:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
