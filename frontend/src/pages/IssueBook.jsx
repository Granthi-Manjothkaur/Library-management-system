
import { useEffect, useState } from 'react';
import { BookUp, CalendarDays } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import Loader from '../components/Loader';
import { formatDate } from '../utils/format';

const BORROW_DAYS = 14;

export default function IssueBook() {
  const toast = useToast();

  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentQ, setStudentQ] = useState('');
  const [bookQ, setBookQ] = useState('');
  const [studentId, setStudentId] = useState('');
  const [bookId, setBookId] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [lastIssued, setLastIssued] = useState(null);

  const load = async () => {
    try {
      const [studentResponse, bookResponse] = await Promise.all([
        api.get('/students', {
          params: { status: 'active' }
        }),
        api.get('/books', {
          params: { availability: 'available' }
        })
      ]);

      // Support APIs that return either an array or { data: [...] }.
      const studentList = Array.isArray(studentResponse.data)
        ? studentResponse.data
        : studentResponse.data?.data || [];

      const bookList = Array.isArray(bookResponse.data)
        ? bookResponse.data
        : bookResponse.data?.data || [];

      setStudents(studentList);
      setBooks(bookList);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fStudents = students.filter((student) =>
    `${student.name || ''} ${student.studentId || ''} ${student.email || ''}`
      .toLowerCase()
      .includes(studentQ.toLowerCase())
  );

  const fBooks = books.filter((book) =>
    `${book.title || ''} ${book.author || ''} ${book.isbn || ''}`
      .toLowerCase()
      .includes(bookQ.toLowerCase())
  );

  // Use the selected IDs to find the actual records.
  const selectedStudent = students.find(
    (student) => String(student._id || student.id) === String(studentId)
  );

  const selectedBook = books.find(
    (book) => String(book._id || book.id) === String(bookId)
  );

  const dueDate = new Date(
    Date.now() + BORROW_DAYS * 24 * 60 * 60 * 1000
  );

  const handleStudentChange = (event) => {
    setStudentId(event.target.value);
    setErrors((previous) => ({
      ...previous,
      student: ''
    }));
  };

  const handleBookChange = (event) => {
    setBookId(event.target.value);
    setErrors((previous) => ({
      ...previous,
      book: ''
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!studentId) {
      nextErrors.student = 'Please select a student.';
    }

    if (!bookId) {
      nextErrors.book = 'Please select a book.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please select both a student and a book.');
      return;
    }

    if (!selectedStudent || !selectedBook) {
      toast.error(
        'The selected student or book could not be found. Please refresh the page and try again.'
      );
      return;
    }

    setBusy(true);

    try {
      const response = await api.post('/issues', {
        studentId,
        bookId
      });

      const result = response.data?.data || response.data;

      toast.success(
        `Book issued successfully. Due date: ${formatDate(result.dueDate)}.`
      );

      setLastIssued(result);
      setStudentId('');
      setBookId('');
      setStudentQ('');
      setBookQ('');
      setErrors({});

      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Issue Book</h1>
          <p>
            Lend an available book to a registered student.
            Default loan period: {BORROW_DAYS} days.
          </p>
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="row g-3">
          {/* Select student */}
          <div className="col-12 col-lg-6">
            <section className="card-box h-100">
              <div className="card-head">
                <h2>1. Select student</h2>
              </div>

              <div className="card-body-pad">
                <input
                  className="form-control mb-2"
                  placeholder="Search students..."
                  value={studentQ}
                  onChange={(event) => setStudentQ(event.target.value)}
                  aria-label="Search students"
                />

                <select
                  className={`form-select ${
                    errors.student ? 'is-invalid' : ''
                  }`}
                  size={7}
                  value={studentId}
                  onChange={handleStudentChange}
                  aria-label="Select student"
                >
                  <option value="">-- Choose a student --</option>

                  {fStudents.map((student) => (
                    <option
                      key={student._id || student.id}
                      value={student._id || student.id}
                    >
                      {student.name} — {student.studentId}
                    </option>
                  ))}
                </select>

                {fStudents.length === 0 && (
                  <div className="cell-sub mt-2">
                    No active students match your search.
                  </div>
                )}

                {errors.student && (
                  <div className="field-error">{errors.student}</div>
                )}

                {selectedStudent && (
                  <p className="small text-success mt-2 mb-0">
                    Selected: {selectedStudent.name}
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Select book */}
          <div className="col-12 col-lg-6">
            <section className="card-box h-100">
              <div className="card-head">
                <h2>2. Select book</h2>
              </div>

              <div className="card-body-pad">
                <input
                  className="form-control mb-2"
                  placeholder="Search available books..."
                  value={bookQ}
                  onChange={(event) => setBookQ(event.target.value)}
                  aria-label="Search available books"
                />

                <select
                  className={`form-select ${
                    errors.book ? 'is-invalid' : ''
                  }`}
                  size={7}
                  value={bookId}
                  onChange={handleBookChange}
                  aria-label="Select book"
                >
                  <option value="">-- Choose a book --</option>

                  {fBooks.map((book) => (
                    <option
                      key={book._id || book.id}
                      value={book._id || book.id}
                    >
                      {book.title} — {book.author} (
                      {book.availableCopies} left)
                    </option>
                  ))}
                </select>

                {fBooks.length === 0 && (
                  <div className="cell-sub mt-2">
                    No available books match your search.
                  </div>
                )}

                {errors.book && (
                  <div className="field-error">{errors.book}</div>
                )}

                {selectedBook && (
                  <p className="small text-success mt-2 mb-0">
                    Selected: {selectedBook.title}
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Summary */}
          <div className="col-12">
            <section className="card-box">
              <div className="card-body-pad d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <div className="fw-semibold mb-1">Summary</div>

                  <div className="text-secondary small">
                    {selectedStudent
                      ? selectedStudent.name
                      : 'No student selected'}
                    {' · '}
                    {selectedBook
                      ? selectedBook.title
                      : 'No book selected'}
                  </div>

                  <div className="small mt-2 d-flex align-items-center gap-1">
                    <CalendarDays size={15} />
                    Issue date: {formatDate(new Date())}
                    {' · '}
                    Due date: <strong>{formatDate(dueDate)}</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  disabled={busy}
                >
                  <BookUp size={18} />
                  {busy ? 'Issuing...' : 'Issue Book'}
                </button>
              </div>
            </section>
          </div>

          {lastIssued && (
            <div className="col-12">
              <div className="alert alert-success mb-0" role="status">
                The last issue was successful.
                {lastIssued.book?.title && (
                  <> Book: <strong>{lastIssued.book.title}</strong>.</>
                )}
                {lastIssued.student?.name && (
                  <> Student: <strong>{lastIssued.student.name}</strong>.</>
                )}
                {lastIssued.dueDate && (
                  <> Due date: {formatDate(lastIssued.dueDate)}.</>
                )}
              </div>
            </div>
          )}
        </div>
      </form>
    </>
  );
}
