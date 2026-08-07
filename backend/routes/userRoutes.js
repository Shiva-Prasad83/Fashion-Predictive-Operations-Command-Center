const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');
const auth = require('../middleware/auth');
const { roleCheck, roleCheckMinimum } = require('../middleware/roleCheck');

router.get('/', auth, roleCheckMinimum('Manager'), getUsers);
router.get('/:id', auth, roleCheckMinimum('Manager'), getUser);
router.put('/:id', auth, roleCheckMinimum('Manager'), updateUser);
router.delete('/:id', auth, roleCheck('Operations Admin'), deleteUser);

module.exports = router;
