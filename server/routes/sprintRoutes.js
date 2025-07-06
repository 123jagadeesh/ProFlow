const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { createSprint, getSprints, getSprintById, updateSprint, deleteSprint, addIssueToSprint, removeIssueFromSprint } = require('../controllers/sprintController');

router.post('/', protect, isAdmin, createSprint);
router.get('/', protect, getSprints);
router.get('/:id', protect, getSprintById);
router.put('/:id', protect, updateSprint);
router.delete('/:id', protect, deleteSprint);
router.post('/add-issue', protect, addIssueToSprint);
router.post('/remove-issue', protect, removeIssueFromSprint);

module.exports = router;