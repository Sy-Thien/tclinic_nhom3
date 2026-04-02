const { Notification } = require('../Database/Entity');
const { Op } = require('sequelize');

// Get unread notifications for current user
exports.getUnreadNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let whereClause = { is_read: false };

        // Only patients have notifications in DB for now
        if (userRole === 'patient') {
            whereClause.patient_id = userId;
        } else {
            // For admin/doctor, return empty for now (can extend later)
            return res.json({ notifications: [] });
        }

        const notifications = await Notification.findAll({
            where: whereClause,
            order: [['create_at', 'DESC']],
            limit: 50
        });

        res.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Lỗi khi tải thông báo' });
    }
};

// Get all notifications with pagination and date filter
exports.getAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { page = 1, limit = 20, date } = req.query;

        let whereClause = {};

        if (userRole === 'patient') {
            whereClause.patient_id = userId;
        } else {
            return res.json({ notifications: [], total: 0, page: 1, totalPages: 0 });
        }

        // Filter by date if provided (format: YYYY-MM-DD)
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            whereClause.create_at = {
                [Op.between]: [startOfDay, endOfDay]
            };
        }

        const offset = (page - 1) * limit;

        const { count, rows: notifications } = await Notification.findAndCountAll({
            where: whereClause,
            order: [['create_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            notifications,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Lỗi khi tải thông báo' });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        let whereClause = { id };

        if (userRole === 'patient') {
            whereClause.patient_id = userId;
        }

        const notification = await Notification.findOne({ where: whereClause });

        if (!notification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        }

        notification.is_read = true;
        notification.update_at = new Date();
        await notification.save();

        res.json({ message: 'Đã đánh dấu đã đọc', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật thông báo' });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let whereClause = { is_read: false };

        if (userRole === 'patient') {
            whereClause.patient_id = userId;
        }

        await Notification.update(
            { is_read: true, update_at: new Date() },
            { where: whereClause }
        );

        res.json({ message: 'Đã đánh dấu tất cả thông báo đã đọc' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật thông báo' });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        let whereClause = { id };

        if (userRole === 'patient') {
            whereClause.patient_id = userId;
        }

        const notification = await Notification.findOne({ where: whereClause });

        if (!notification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        }

        await notification.destroy();

        res.json({ message: 'Đã xóa thông báo' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Lỗi khi xóa thông báo' });
    }
};
