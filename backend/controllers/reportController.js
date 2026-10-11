
const { readDB } = require('../config/jsonDB');
const asyncHandler = require('../utils/asyncHandler');
const { decorateIssue } = require('../utils/helpers');

function getIssueDetails(issue, db) {
  const student = db.users.find(
    (user) => user._id === issue.student
  );

  const book = db.books.find(
    (item) => item._id === issue.book
  );

  const decorated = decorateIssue(issue);

  const isOverdue =
    issue.status === 'issued' &&
    new Date(issue.dueDate) < new Date();

  return {
    ...decorated,
    isOverdue,
    student: student
      ? {
          _id: student._id,
          name: student.name,
          studentId: student.studentId
        }
      : null,
    book: book
      ? {
          _id: book._id,
          title: book.title,
          author: book.author,
          category: book.category,
          isbn: book.isbn
        }
      : null
  };
}

function filterByDate(issues, from, to) {
  return issues.filter((issue) => {
    const date = new Date(issue.issueDate);

    if (from) {
      const start = new Date(from);
      if (!Number.isNaN(start.getTime()) && date < start) {
        return false;
      }
    }

    if (to) {
      const end = new Date(to);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        if (date > end) return false;
      }
    }

    return true;
  });
}

// Books and availability report
exports.getBooksReport = asyncHandler(async (req, res) => {
  const db = await readDB();

  const rows = db.books.map((book) => ({
    ...book,
    issuedCopies: Math.max(
      0,
      Number(book.totalCopies || 0) -
      Number(book.availableCopies || 0)
    )
  }));

  res.json({
    totals: {
      titles: rows.length,
      totalCopies: rows.reduce(
        (sum, book) => sum + Number(book.totalCopies || 0),
        0
      ),
      availableCopies: rows.reduce(
        (sum, book) => sum + Number(book.availableCopies || 0),
        0
      ),
      issuedCopies: rows.reduce(
        (sum, book) => sum + book.issuedCopies,
        0
      )
    },
    rows
  });
});

// Overdue books report
exports.getOverdueReport = asyncHandler(async (req, res) => {
  const db = await readDB();
  const now = new Date();

  const issues = db.issues.filter(
    (issue) =>
      issue.status === 'issued' &&
      new Date(issue.dueDate) < now
  );

  res.json(
    issues.map((issue) => getIssueDetails(issue, db))
  );
});

// Most borrowed books report
exports.getMostBorrowedReport = asyncHandler(async (req, res) => {
  const db = await readDB();
  const issues = filterByDate(
    db.issues,
    req.query.from,
    req.query.to
  );

  const counts = {};

  for (const issue of issues) {
    counts[issue.book] = (counts[issue.book] || 0) + 1;
  }

  const books = db.books
    .map((book) => ({
      ...book,
      timesBorrowed: counts[book._id] || 0
    }))
    .filter((book) => book.timesBorrowed > 0)
    .sort((a, b) => b.timesBorrowed - a.timesBorrowed);

  res.json(books);
});

// Student borrowing history report
exports.getStudentHistoryReport = asyncHandler(async (req, res) => {
  const db = await readDB();

  const issues = filterByDate(
    db.issues.filter(
      (issue) => issue.student === req.params.studentId
    ),
    req.query.from,
    req.query.to
  );

  issues.sort(
    (a, b) => new Date(b.issueDate) - new Date(a.issueDate)
  );

  res.json(
    issues.map((issue) => getIssueDetails(issue, db))
  );
});


