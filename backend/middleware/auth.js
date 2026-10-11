
const jwt = require('jsonwebtoken');
const { readDB } = require('../config/jsonDB');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Not authorized. Please log in.'
    });
  }

  const decoded = jwt.verify(
    header.split(' ')[1],
    process.env.JWT_SECRET
  );

  const db = await readDB();
  const user = db.users.find(
    (item) => item._id === decoded.id
  );

  if (!user || !user.isActive) {
    return res.status(401).json({
      message: 'Account not found or deactivated.'
    });
  }

  // Never attach the password hash to the request user.
  const { password, ...safeUser } = user;
  req.user = safeUser;

  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message: 'You do not have permission to do this.'
    });
  }

  next();
};

module.exports = { protect, authorize };

