
const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/issueController');

router.use(protect);

router.post(
  '/',
  authorize('admin'),
  body('studentId').isUUID().withMessage('Invalid student ID'),
  body('bookId').isUUID().withMessage('Invalid book ID'),
  validate,
  c.issueBook
);

router.patch(
  '/:id/return',
  authorize('admin'),
  param('id').isUUID().withMessage('Invalid issue ID'),
  validate,
  c.returnBook
);

router.get(
  '/',
  authorize('admin'),
  c.getIssues
);

router.get(
  '/my',
  c.getMyIssues
);

module.exports = router;

