const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, deleteNotification, createNotification } = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const { roleCheckMinimum } = require('../middleware/roleCheck');

router.get('/', auth, getNotifications);
router.put('/mark-all-read', auth, markAllAsRead);
router.put('/:id/read', auth, markAsRead);
router.delete('/:id', auth, deleteNotification);
router.post('/', auth, roleCheckMinimum('Manager'), createNotification);

module.exports = router;
