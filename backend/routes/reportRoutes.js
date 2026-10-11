
const router = require('express').Router();
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/reportController');

router.use(protect, authorize('admin'));

router.get('/books', c.getBooksReport);
router.get('/overdue', c.getOverdueReport);
router.get('/most-borrowed', c.getMostBorrowedReport);

router.get(
  '/student-history/:studentId',
  param('studentId').isUUID().withMessage('Invalid student ID'),
  validate,
  c.getStudentHistoryReport
);

module.exports = router;

