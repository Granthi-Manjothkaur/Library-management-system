
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { readDB, writeDB } = require('../config/jsonDB');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError } = require('../middleware/error');

const FIELDS = ['name', 'email', 'studentId', 'phone', 'department'];

const pick = (body) =>
  FIELDS.reduce((result, key) => {
    if (body[key] !== undefined) result[key] = body[key];
    return result;
  }, {});

exports.getStudents = asyncHandler(async (req, res) => {
  const db = await readDB();
  const { q, status } = req.query;

  let students = db.users.filter((user) => user.role === 'student');

  if (q) {
    const query = q.trim().toLowerCase();
    students = students.filter((user) =>
      [user.name, user.studentId, user.email]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }

  if (status === 'active') {
    students = students.filter((user) => user.isActive);
  }
  if (status === 'inactive') {
    students = students.filter((user) => !user.isActive);
  }

  students.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(students.map(({ password, ...student }) => student));
});

exports.createStudent = asyncHandler(async (req, res) => {
  const db = await readDB();
  const data = pick(req.body);

  const duplicate = db.users.some(
    (user) =>
      user.email.toLowerCase() === data.email.toLowerCase() ||
      user.studentId === data.studentId
  );

  if (duplicate) {
    throw new HttpError(409, 'Email or student ID already exists.');
  }

  const now = new Date().toISOString();

  const student = {
    _id: randomUUID(),
    ...data,
    email: data.email.toLowerCase(),
    password: await bcrypt.hash(req.body.password, 10),
    role: 'student',
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  db.users.push(student);
  await writeDB(db);

  const { password, ...safeStudent } = student;
  res.status(201).json(safeStudent);
});

exports.updateStudent = asyncHandler(async (req, res) => {
  const db = await readDB();
  const student = db.users.find(
    (user) => user._id === req.params.id && user.role === 'student'
  );

  if (!student) throw new HttpError(404, 'Student not found.');

  const data = pick(req.body);

  if (data.email !== undefined) {
    data.email = data.email.toLowerCase();
  }

  const duplicate = db.users.some(
    (user) =>
      user._id !== student._id &&
      ((data.email && user.email.toLowerCase() === data.email) ||
        (data.studentId && user.studentId === data.studentId))
  );

  if (duplicate) {
    throw new HttpError(409, 'Email or student ID already exists.');
  }

  Object.assign(student, data);

  if (req.body.password) {
    student.password = await bcrypt.hash(req.body.password, 10);
  }

  student.updatedAt = new Date().toISOString();
  await writeDB(db);

  const { password, ...safeStudent } = student;
  res.json(safeStudent);
});

exports.toggleStatus = asyncHandler(async (req, res) => {
  const db = await readDB();
  const student = db.users.find(
    (user) => user._id === req.params.id && user.role === 'student'
  );

  if (!student) throw new HttpError(404, 'Student not found.');

  student.isActive = !student.isActive;
  student.updatedAt = new Date().toISOString();

  await writeDB(db);

  const { password, ...safeStudent } = student;
  res.json(safeStudent);
});

exports.deleteStudent = asyncHandler(async (req, res) => {
  const db = await readDB();
  const index = db.users.findIndex(
    (user) => user._id === req.params.id && user.role === 'student'
  );

  if (index === -1) throw new HttpError(404, 'Student not found.');

  const student = db.users[index];
  const hasHistory = db.issues.some(
    (issue) => issue.student === student._id
  );

  if (hasHistory) {
    throw new HttpError(
      400,
      'This student has borrowing records. Deactivate the account instead of deleting it.'
    );
  }

  db.users.splice(index, 1);
  await writeDB(db);

  res.json({ message: 'Student deleted.' });
});

