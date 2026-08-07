const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, approveTask, escalateTask, deleteTask } = require('../controllers/taskController');
const auth = require('../middleware/auth');
const { roleCheckMinimum } = require('../middleware/roleCheck');

router.get('/', auth, getTasks);
router.get('/:id', auth, getTask);
router.post('/', auth, roleCheckMinimum('Analyst'), createTask);
router.put('/:id', auth, updateTask);
router.post('/:id/approve', auth, roleCheckMinimum('Manager'), approveTask);
router.post('/:id/escalate', auth, escalateTask);
router.delete('/:id', auth, roleCheckMinimum('Manager'), deleteTask);

module.exports = router;
