
const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/bookController');

const rules = (isCreate) => [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('isbn').trim().notEmpty().withMessage('ISBN is required')
    .isLength({ min: 10, max: 20 })
    .withMessage('ISBN must be 10 to 20 characters'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('totalCopies')
    .if((value, { req }) => isCreate || req.body.totalCopies !== undefined)
    .isInt({ min: 1 })
    .withMessage('Total copies must be a whole number of at least 1'),
  body('publicationYear')
    .optional({ checkFalsy: true })
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Enter a valid publication year'),
  body('coverImage')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Cover image must be a valid URL'),
];

router.use(protect);

router.get('/', c.getBooks);
router.get('/categories', c.getCategories);

router.get(
  '/:id',
  param('id').isUUID().withMessage('Invalid book ID'),
  validate,
  c.getBook
);

router.post('/', authorize('admin'), rules(true), validate, c.createBook);

router.put(
  '/:id',
  authorize('admin'),
  param('id').isUUID().withMessage('Invalid book ID'),
  rules(false),
  validate,
  c.updateBook
);

router.delete(
  '/:id',
  authorize('admin'),
  param('id').isUUID().withMessage('Invalid book ID'),
  validate,
  c.deleteBook
);

module.exports = router;

