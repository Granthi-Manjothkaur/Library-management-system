
const { randomUUID } = require('crypto');
const { readDB, writeDB } = require('../config/jsonDB');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError } = require('../middleware/error');

const FIELDS = [
  'title', 'author', 'isbn', 'category', 'publisher',
  'publicationYear', 'description', 'totalCopies', 'coverImage'
];

const pick = (body) =>
  FIELDS.reduce((result, key) => {
    if (body[key] !== undefined) result[key] = body[key];
    return result;
  }, {});

exports.getBooks = asyncHandler(async (req, res) => {
  const db = await readDB();
  const { q, category, availability } = req.query;

  let books = db.books;

  if (q) {
    const query = q.trim().toLowerCase();
    books = books.filter((book) =>
      [book.title, book.author, book.isbn, book.category]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }

  if (category) {
    books = books.filter((book) => book.category === category);
  }

  if (availability === 'available') {
    books = books.filter((book) => book.availableCopies > 0);
  }

  if (availability === 'unavailable') {
    books = books.filter((book) => book.availableCopies === 0);
  }

  res.json(
    [...books].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  );
});

exports.getCategories = asyncHandler(async (req, res) => {
  const db = await readDB();
  res.json([...new Set(db.books.map((book) => book.category))].sort());
});

exports.getBook = asyncHandler(async (req, res) => {
  const db = await readDB();
  const book = db.books.find((item) => item._id === req.params.id);

  if (!book) throw new HttpError(404, 'Book not found.');
  res.json(book);
});

exports.createBook = asyncHandler(async (req, res) => {
  const db = await readDB();
  const data = pick(req.body);

  const duplicate = db.books.some(
    (book) => book.isbn.toLowerCase() === String(data.isbn).toLowerCase()
  );

  if (duplicate) throw new HttpError(409, 'A book with this ISBN already exists.');

  const now = new Date().toISOString();
  const totalCopies = Number(data.totalCopies);

  const book = {
    _id: randomUUID(),
    ...data,
    totalCopies,
    availableCopies: totalCopies,
    createdAt: now,
    updatedAt: now
  };

  db.books.push(book);
  await writeDB(db);

  res.status(201).json(book);
});

exports.updateBook = asyncHandler(async (req, res) => {
  const db = await readDB();
  const book = db.books.find((item) => item._id === req.params.id);

  if (!book) throw new HttpError(404, 'Book not found.');

  const data = pick(req.body);

  if (data.isbn !== undefined) {
    const duplicate = db.books.some(
      (item) => item._id !== book._id &&
        item.isbn.toLowerCase() === String(data.isbn).toLowerCase()
    );
    if (duplicate) throw new HttpError(409, 'A book with this ISBN already exists.');
  }

  if (data.totalCopies !== undefined) {
    const total = Number(data.totalCopies);
    const onLoan = book.totalCopies - book.availableCopies;

    if (total < onLoan) {
      throw new HttpError(
        400,
        `${onLoan} copies are currently issued, so total copies cannot be less than ${onLoan}.`
      );
    }

    data.totalCopies = total;
    data.availableCopies = total - onLoan;
  }

  Object.assign(book, data);
  book.updatedAt = new Date().toISOString();

  await writeDB(db);
  res.json(book);
});

exports.deleteBook = asyncHandler(async (req, res) => {
  const db = await readDB();
  const index = db.books.findIndex((item) => item._id === req.params.id);

  if (index === -1) throw new HttpError(404, 'Book not found.');

  const hasActiveIssue = db.issues.some(
    (issue) => issue.book === db.books[index]._id && issue.status === 'issued'
  );

  if (hasActiveIssue) {
    throw new HttpError(
      400,
      'This book is currently issued to a student and cannot be deleted.'
    );
  }

  db.books.splice(index, 1);
  await writeDB(db);

  res.json({ message: 'Book deleted.' });
});
