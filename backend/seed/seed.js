// Demo data loader. Run with:  npm run seed
// WARNING: this DELETES all users, books and issue records first.
// It is separate from the app and never runs automatically.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Issue = require('../models/Issue');
const { DAY_MS } = require('../utils/helpers');

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const studentPassword = process.env.SEED_STUDENT_PASSWORD;

const cover = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

const books = [
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Programming', publisher: 'Prentice Hall', publicationYear: 2008, totalCopies: 5, description: 'A handbook of agile software craftsmanship.' },
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '9780262033848', category: 'Computer Science', publisher: 'MIT Press', publicationYear: 2009, totalCopies: 4, description: 'The standard textbook on algorithms.' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '9780135957059', category: 'Programming', publisher: 'Addison-Wesley', publicationYear: 2019, totalCopies: 3, description: 'Your journey to mastery.' },
  { title: 'Database System Concepts', author: 'Abraham Silberschatz', isbn: '9780078022159', category: 'Computer Science', publisher: 'McGraw-Hill', publicationYear: 2019, totalCopies: 3, description: 'Fundamentals of database systems.' },
  { title: 'Operating System Concepts', author: 'Abraham Silberschatz', isbn: '9781119800361', category: 'Computer Science', publisher: 'Wiley', publicationYear: 2021, totalCopies: 4, description: 'The dinosaur book on operating systems.' },
  { title: 'Wings of Fire', author: 'A. P. J. Abdul Kalam', isbn: '9788173711466', category: 'Biography', publisher: 'Universities Press', publicationYear: 1999, totalCopies: 6, description: 'The autobiography of Dr. A. P. J. Abdul Kalam.' },
  { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '9780062315007', category: 'Fiction', publisher: 'HarperOne', publicationYear: 2014, totalCopies: 5, description: 'A fable about following your dream.' },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', category: 'Self-Help', publisher: 'Avery', publicationYear: 2018, totalCopies: 4, description: 'Tiny changes, remarkable results.' },
  { title: 'Engineering Mathematics', author: 'B. S. Grewal', isbn: '9788174091956', category: 'Mathematics', publisher: 'Khanna Publishers', publicationYear: 2017, totalCopies: 8, description: 'Higher engineering mathematics for students.' },
  { title: 'Concepts of Physics', author: 'H. C. Verma', isbn: '9788177091878', category: 'Science', publisher: 'Bharati Bhawan', publicationYear: 2018, totalCopies: 5, description: 'Physics concepts with problems.' },
].map((b) => ({ ...b, coverImage: cover(b.isbn) }));

const students = [
  { name: 'Aarav Sharma', email: 'aarav@student.edu', studentId: 'CS2024001', phone: '9876500001', department: 'Computer Science' },
  { name: 'Priya Reddy', email: 'priya@student.edu', studentId: 'CS2024002', phone: '9876500002', department: 'Computer Science' },
  { name: 'Rohan Patel', email: 'rohan@student.edu', studentId: 'EC2024003', phone: '9876500003', department: 'Electronics' },
  { name: 'Sneha Iyer', email: 'sneha@student.edu', studentId: 'ME2024004', phone: '9876500004', department: 'Mechanical' },
  { name: 'Karthik Rao', email: 'karthik@student.edu', studentId: 'IT2024005', phone: '9876500005', department: 'Information Technology' },
];

const run = async () => {
  if (!process.env.MONGO_URI || !adminEmail || !adminPassword || !studentPassword) {
    throw new Error('Set MONGO_URI and the SEED_* values in your .env file first (see .env.example).');
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Clearing old data...');
  await Promise.all([User.deleteMany({}), Book.deleteMany({}), Issue.deleteMany({})]);
  await Promise.all([User.syncIndexes(), Book.syncIndexes(), Issue.syncIndexes()]);

  await User.create({ name: 'Library Admin', email: adminEmail, password: adminPassword, role: 'admin' });
  const createdStudents = [];
  for (const s of students) createdStudents.push(await User.create({ ...s, password: studentPassword, role: 'student' }));
  const createdBooks = await Book.create(books);

  // A few sample transactions: [studentIndex, bookIndex, daysAgoIssued, returnedAfterDays|null]
  const samples = [
    [0, 0, 3, null],
    [1, 1, 20, null], // overdue (due 14 days after issue)
    [2, 5, 25, null], // overdue
    [0, 6, 30, 10],   // returned on time
    [3, 7, 40, 30],   // returned late
    [4, 0, 8, null],
    [1, 2, 5, null],
  ];
  const now = Date.now();
  for (const [si, bi, daysAgo, returnedAfter] of samples) {
    const issueDate = new Date(now - daysAgo * DAY_MS);
    const dueDate = new Date(issueDate.getTime() + 14 * DAY_MS);
    const doc = { student: createdStudents[si]._id, book: createdBooks[bi]._id, issueDate, dueDate };
    if (returnedAfter !== null) {
      const returnDate = new Date(issueDate.getTime() + returnedAfter * DAY_MS);
      const late = Math.max(0, Math.ceil((returnDate - dueDate) / DAY_MS));
      Object.assign(doc, { status: 'returned', returnDate, fine: late * (Number(process.env.FINE_PER_DAY) || 5) });
    } else {
      await Book.updateOne({ _id: createdBooks[bi]._id }, { $inc: { availableCopies: -1 } });
    }
    await Issue.create(doc);
  }

  console.log('Seed complete.');
  console.log(`Admin login:   ${adminEmail}  /  (SEED_ADMIN_PASSWORD from .env)`);
  console.log(`Student login: aarav@student.edu  /  (SEED_STUDENT_PASSWORD from .env)`);
};

run()
  .catch((e) => {
    console.error('Seed failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
