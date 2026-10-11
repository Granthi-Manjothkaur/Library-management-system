import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import SearchInput from '../components/SearchInput';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { AvailabilityBadge } from '../components/StatusBadge';
import { PLACEHOLDER_COVER } from '../utils/format';

const onImgError = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = PLACEHOLDER_COVER;
};

export default function BrowseBooks() {
  const toast = useToast();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/books/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api.get('/books', { params: { q: q || undefined, category: category || undefined, availability: availability || undefined } })
        .then((r) => setBooks(r.data))
        .catch((err) => toast.error(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, availability]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Browse Books</h1>
          <p>Search the catalogue and check which books are available.</p>
        </div>
      </div>

      <section className="card-box">
        <div className="filter-bar">
          <SearchInput value={q} onChange={setQ} placeholder="Search by title, author, ISBN or category" />
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="form-select" value={availability} onChange={(e) => setAvailability(e.target.value)} aria-label="Filter by availability">
            <option value="">All availability</option>
            <option value="available">Available now</option>
            <option value="unavailable">Not available</option>
          </select>
        </div>

        {loading ? (
          <Loader />
        ) : books.length === 0 ? (
          <EmptyState title="No books found" message="Try a different search or filter." />
        ) : (
          <div className="book-grid">
            {books.map((b) => (
              <button key={b._id} className="book-card" onClick={() => setSelected(b)} aria-label={`View details of ${b.title}`}>
                <img className="book-cover" src={b.coverImage || PLACEHOLDER_COVER} alt="" loading="lazy" onError={onImgError} />
                <div className="info">
                  <div className="t">{b.title}</div>
                  <div className="cell-sub">{b.author}</div>
                  <div className="mt-auto"><AvailabilityBadge book={b} /></div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <Modal title="Book details" size="lg" onClose={() => setSelected(null)}>
          <div className="row g-4">
            <div className="col-12 col-md-4 text-center">
              <img className="detail-cover" src={selected.coverImage || PLACEHOLDER_COVER} alt={`Cover of ${selected.title}`} onError={onImgError} />
            </div>
            <div className="col-12 col-md-8">
              <h3 className="h5 fw-bold mb-1">{selected.title}</h3>
              <p className="text-secondary">by {selected.author}</p>
              <dl className="detail-list mb-3">
                <dt>ISBN</dt><dd>{selected.isbn}</dd>
                <dt>Category</dt><dd>{selected.category}</dd>
                <dt>Publisher</dt><dd>{selected.publisher || '—'}</dd>
                <dt>Year</dt><dd>{selected.publicationYear || '—'}</dd>
                <dt>Copies</dt><dd>{selected.availableCopies} available of {selected.totalCopies}</dd>
                <dt>Status</dt><dd><AvailabilityBadge book={selected} /></dd>
              </dl>
              {selected.description && <p className="mb-0">{selected.description}</p>}
              <p className="small text-secondary mt-3 mb-0">To borrow this book, please visit the library desk.</p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
