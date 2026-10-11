import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import SearchInput from '../components/SearchInput';
import BookForm from '../components/BookForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { AvailabilityBadge } from '../components/StatusBadge';
import { PLACEHOLDER_COVER } from '../utils/format';

export default function Books() {
  const toast = useToast();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadCategories = useCallback(() => {
    api.get('/books/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  // Reload the list whenever a search or filter changes (small delay while typing).
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
  }, [q, category, availability, reloadKey]);

  useEffect(loadCategories, [loadCategories]);

  const refresh = () => {
    setReloadKey((k) => k + 1); // makes the list load again
    loadCategories();
  };

  const onSaved = (book, wasEdit) => {
    toast.success(wasEdit ? 'Book updated successfully.' : 'Book added successfully.');
    setEditing(undefined);
    refresh();
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/books/${deleting._id}`);
      toast.success('Book deleted.');
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      header: 'Book',
      render: (b) => (
        <div className="d-flex align-items-center gap-3">
          <img className="thumb" src={b.coverImage || PLACEHOLDER_COVER} alt="" loading="lazy"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_COVER; }} />
          <div>
            <div className="cell-title">{b.title}</div>
            <div className="cell-sub">{b.author}</div>
          </div>
        </div>
      ),
    },
    { header: 'ISBN', render: (b) => b.isbn },
    { header: 'Category', render: (b) => <span className="badge-soft blue">{b.category}</span> },
    { header: 'Year', className: 'hide-mobile', render: (b) => b.publicationYear || '—' },
    { header: 'Copies', render: (b) => `${b.availableCopies} / ${b.totalCopies}` },
    { header: 'Status', render: (b) => <AvailabilityBadge book={b} /> },
    {
      header: 'Actions',
      render: (b) => (
        <div className="d-flex gap-1">
          <button className="btn btn-soft btn-sm" onClick={() => setEditing(b)} aria-label={`Edit ${b.title}`}><Pencil size={15} /></button>
          <button className="btn btn-outline-danger btn-sm" onClick={() => setDeleting(b)} aria-label={`Delete ${b.title}`}><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Books</h1>
          <p>Add, edit and track every book in the library.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(null)}><Plus size={18} /> Add Book</button>
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
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
        <DataTable
          columns={columns} rows={books} loading={loading}
          emptyTitle="No books found" emptyMessage="Try a different search or add a new book."
        />
      </section>

      {editing !== undefined && (
        <BookForm book={editing} categories={categories} onClose={() => setEditing(undefined)} onSaved={onSaved} />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete book" danger busy={busy} confirmText="Delete"
          message={`Are you sure you want to delete "${deleting.title}"? This cannot be undone.`}
          onConfirm={confirmDelete} onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
