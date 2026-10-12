
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { readDB, writeDB } = require('../config/jsonDB');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError } = require('../middleware/error');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  studentId: user.studentId,
  phone: user.phone,
  department: user.department
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const db = await readDB();

  const user = db.users.find(
    (item) => item.email.toLowerCase() === email.toLowerCase()
  );

 if (!user || !(await bcrypt.compare(password, user.password))) {
  throw new HttpError(401, 'Invalid email or password.');
}
  if (!user.isActive) {
    throw new HttpError(403, 'Your account is deactivated. Contact the librarian.');
  }

  res.json({
    token: signToken(user._id),
    user: publicUser(user)
  });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const db = await readDB();
  const user = db.users.find((item) => item._id === req.user._id);

  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const matches = await bcrypt.compare(
    req.body.currentPassword,
    user.password
  );

  if (!matches) {
    throw new HttpError(400, 'Current password is incorrect.');
  }

  user.password = await bcrypt.hash(req.body.newPassword, 10);
  user.updatedAt = new Date().toISOString();

  await writeDB(db);

  res.json({ message: 'Password updated successfully.' });
});

