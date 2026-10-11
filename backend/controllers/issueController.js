
const { randomUUID } = require('crypto');
const { readDB, writeDB } = require('../config/jsonDB');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError } = require('../middleware/error');
const {
  DAY_MS,
  config,
  calcFine,
  decorateIssue,
  escapeRegex,
  dateRange
} = require('../utils/helpers');

function populateIssue(issue, db) {
  const student = db.users.find((user) => user._id === issue.student);
  const book = db.books.find((item) => item._id === issue.book);

  return {
    ...issue,
    student: student
      ? {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          email: student.email,
          department: student.department
        }
      : null,
    book: book
      ? {
          _id: book._id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          coverImage: book.coverImage
        }
      : null
  };
}

exports.issueBook = asyncHandler(async (req, res) => {
  const db = await readDB();
  const { studentId, bookId } = req.body;
  const { borrowDays, maxActive } = config();

  const student = db.users.find(
    (user) => user._id === studentId && user.role === 'student'
  );

  if (!student) throw new HttpError(404, 'Student not found.');
  if (!student.isActive) throw new HttpError(400, 'This student account is deactivated.');

  if (db.issues.some(
    (issue) => issue.student === studentId &&
      issue.book === bookId &&
      issue.status === 'issued'
  )) {
    throw new HttpError(409, 'This student already has this book issued.');
  }

  const activeCount = db.issues.filter(
    (issue) => issue.student === studentId && issue.status === 'issued'
  ).length;

  if (activeCount >= maxActive) {
    throw new HttpError(400, `A student can borrow at most ${maxActive} books at a time.`);
  }

  const book = db.books.find((item) => item._id === bookId);
  if (!book) throw new HttpError(404, 'Book not found.');
  if (book.availableCopies < 1) {
    throw new HttpError(400, 'No copies of this book are available right now.');
  }

  const now = new Date();
  const issue = {
    _id: randomUUID(),
    student: studentId,
    book: bookId,
    issueDate: now.toISOString(),
    dueDate: new Date(now.getTime() + borrowDays * DAY_MS).toISOString(),
    returnDate: null,
    status: 'issued',
    fine: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  book.availableCopies -= 1;
  book.updatedAt = now.toISOString();
  db.issues.push(issue);
  await writeDB(db);

  res.status(201).json(decorateIssue(populateIssue(issue, db)));
});

exports.returnBook = asyncHandler(async (req, res) => {
  const db = await readDB();
  const issue = db.issues.find((item) => item._id === req.params.id);

  if (!issue) throw new HttpError(404, 'Issue record not found.');
  if (issue.status === 'returned') {
    throw new HttpError(400, 'This book has already been returned.');
  }

  const book = db.books.find((item) => item._id === issue.book);
  if (!book) throw new HttpError(404, 'Book not found.');

  const now = new Date();
  issue.status = 'returned';
  issue.returnDate = now.toISOString();
  issue.fine = calcFine(issue.dueDate, now);
  issue.updatedAt = now.toISOString();

  book.availableCopies += 1;
  book.updatedAt = now.toISOString();

  await writeDB(db);
  res.json(decorateIssue(populateIssue(issue, db)));
});

exports.getIssues = asyncHandler(async (req, res) => {
  const db = await readDB();
  const { status, q, from, to } = req.query;
  const range = dateRange(from, to);

  let issues = [...db.issues];

  if (status === 'issued' || status === 'returned') {
    issues = issues.filter((issue) => issue.status === status);
  }

  if (status === 'overdue') {
    issues = issues.filter(
      (issue) => issue.status === 'issued' && new Date(issue.dueDate) < new Date()
    );
  }

  if (range) {
    issues = issues.filter((issue) => {
      const date = new Date(issue.issueDate);
      return (!range.$gte || date >= range.$gte) &&
        (!range.$lte || date <= range.$lte);
    });
  }

  if (q) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');

    issues = issues.filter((issue) => {
      const student = db.users.find((user) => user._id === issue.student);
      const book = db.books.find((item) => item._id === issue.book);

      return rx.test(student?.name || '') ||
        rx.test(student?.studentId || '') ||
        rx.test(student?.email || '') ||
        rx.test(book?.title || '') ||
        rx.test(book?.isbn || '') ||
        rx.test(book?.author || '');
    });
  }

  issues.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

  res.json(issues.map((issue) => decorateIssue(populateIssue(issue, db))));
});


exports.getMyIssues = asyncHandler(async (req, res) => {
  const db = await readDB();

  // Support both possible user ID formats
  const studentId = String(req.user._id || req.user.id || '');

  const issues = db.issues
    .filter(
      (issue) =>
        String(issue.student || issue.studentId || '') === studentId
    )
    .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

  res.json(issues.map((issue) => decorateIssue(populateIssue(issue, db))));
});



