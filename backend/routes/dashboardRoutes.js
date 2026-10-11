

const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/dashboardController');

// Admin dashboard
router.get('/', protect, authorize('admin'), c.getDashboard);

// Student dashboard
router.get('/student', protect, authorize('student'), c.getStudentDashboard);

module.exports = router;


