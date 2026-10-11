
const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/studentController');

const idRule = param('id')
  .isUUID()
  .withMessage('Invalid student ID');

const rules = (isCreate) => [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('Enter a valid email address'),
  body('studentId').trim().notEmpty().withMessage('Student ID is required'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[0-9+\-\s]{7,15}$/)
    .withMessage('Enter a valid phone number'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  isCreate
    ? body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    : body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

router.use(protect, authorize('admin'));

router.get('/', c.getStudents);
router.post('/', rules(true), validate, c.createStudent);
router.put('/:id', idRule, rules(false), validate, c.updateStudent);
router.patch('/:id/status', idRule, validate, c.toggleStatus);
router.delete('/:id', idRule, validate, c.deleteStudent);

module.exports = router;
