
const { readDB } = require('../config/jsonDB');
const asyncHandler = require('../utils/asyncHandler');

// Admin dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const db = await readDB();
  const now = new Date();

  const totalBooks = db.books.reduce(
    (total, book) => total + Number(book.totalCopies || 0), 0
  );

  const availableBooks = db.books.reduce(
    (total, book) => total + Number(book.availableCopies || 0), 0
  );

  const issuedIssues = db.issues.filter(
    (issue) => issue.status === 'issued'
  );

  const overdueIssues = issuedIssues.filter(
    (issue) => new Date(issue.dueDate) < now
  );

  const returnedIssues = db.issues.filter(
    (issue) => issue.status === 'returned'
  );

  res.json({
    totalBooks,
    availableBooks,
    issuedBooks: issuedIssues.length,
    overdueBooks: overdueIssues.length,
    returnedBooks: returnedIssues.length,
    totalStudents: db.users.filter(
      (user) => user.role === 'student'
    ).length,
    activeStudents: db.users.filter(
      (user) => user.role === 'student' && user.isActive
    ).length
  });
});

// Student dashboard
exports.getStudentDashboard = asyncHandler(async (req, res) => {
  const db = await readDB();
  const now = new Date();

  const studentId = req.user.id || req.user._id;
  const studentIssues = db.issues.filter(
    (issue) =>
      String(issue.student) === String(studentId) ||
      String(issue.studentId) === String(studentId)
  );

  const issuedIssues = studentIssues.filter(
    (issue) => issue.status === 'issued'
  );

  const overdueIssues = issuedIssues.filter(
    (issue) => new Date(issue.dueDate) < now
  );

  const dueSoon = issuedIssues
    .filter((issue) => new Date(issue.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5)
    .map((issue) => {
      const book = db.books.find(
        (b) => String(b._id || b.id) === String(issue.book || issue.bookId)
      );

      return {
        ...issue,
        _id: issue._id || issue.id,
        book: book ? { title: book.title } : { title: 'Book details unavailable' },
        fine: Number(issue.fine || 0)
      };
    });

  res.json({
    currentlyBorrowed: issuedIssues.length,
    overdue: overdueIssues.length,
    totalFine: studentIssues.reduce(
      (total, issue) => total + Number(issue.fine || 0), 0
    ),
    totalBorrowed: studentIssues.length,
    dueSoon
  });
});

