const { v4: uuidv4 } = require('uuid');
const Notification = require('../models/Notification');

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, type, urgent } = req.query;
    const filter = { recipientId: req.user.userId, organisationId: req.user.organisationId };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (urgent !== undefined) filter.urgent = urgent === 'true';

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ ...filter, status: 'unread' });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.', error: error.message });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ notificationId: req.params.id, recipientId: req.user.userId, organisationId: req.user.organisationId });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });

    notification.status = 'read';
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read.', data: { notification } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.', error: error.message });
  }
};

// PUT /api/notifications/mark-all-read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user.userId, organisationId: req.user.organisationId, status: 'unread' },
      { $set: { status: 'read', readAt: new Date() } }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read.', error: error.message });
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const result = await Notification.deleteOne({ notificationId: req.params.id, recipientId: req.user.userId, organisationId: req.user.organisationId });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'Notification not found.' });

    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete notification.', error: error.message });
  }
};

// POST /api/notifications (Admin/System only)
const createNotification = async (req, res) => {
  try {
    const { title, message, type, severity, urgent, recipientId, linkedRecord, actionUrl } = req.body;

    const notification = new Notification({
      notificationId: uuidv4(),
      title,
      message,
      type,
      severity: severity || 'info',
      urgent: urgent || false,
      recipientId,
      senderId: req.user.userId,
      linkedRecord,
      actionUrl,
      organisationId: req.user.organisationId
    });

    await notification.save();

    res.status(201).json({ success: true, message: 'Notification created.', data: { notification } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create notification.', error: error.message });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, createNotification };
