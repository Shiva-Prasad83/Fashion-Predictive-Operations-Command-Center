const express = require('express');
const router = express.Router();
const { getWorkflows, getWorkflow, createWorkflow, updateWorkflow, deleteWorkflow, getSLAStats } = require('../controllers/workflowController');
const auth = require('../middleware/auth');
const { roleCheckMinimum } = require('../middleware/roleCheck');

router.get('/', auth, getWorkflows);
router.get('/stats/sla', auth, getSLAStats);
router.get('/:id', auth, getWorkflow);
router.post('/', auth, roleCheckMinimum('Analyst'), createWorkflow);
router.put('/:id', auth, roleCheckMinimum('Analyst'), updateWorkflow);
router.delete('/:id', auth, roleCheckMinimum('Manager'), deleteWorkflow);

module.exports = router;
