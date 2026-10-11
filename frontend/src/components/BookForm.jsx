import { useState } from 'react';
import Modal from './Modal';
import api, { getErrorMessage } from '../services/api';

const empty = {
  title: '', author: '', isbn: '', category: '', publisher: '', publicationYear: '', description: '', totalCopies: 1, coverImage: '',
};

// Used for both "Add book" (book = null) and "Edit book".
export default function BookForm({ book, categories, onClose, onSaved }) {
  const [form, setForm] = useState(book ? { ...empty, ...book, publicationYear: book.publicationYear || '' } : empty);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.author.trim()) e.author = 'Author is required';
    if (!form.isbn.trim()) e.isbn = 'ISBN is required';
    else if (form.isbn.trim().length < 10 || form.isbn.trim().length > 20) e.isbn = 'ISBN must be 10 to 20 characters';
    if (!form.category.trim()) e.category = 'Category is required';
    if (!Number.isInteger(Number(form.totalCopies)) || Number(form.totalCopies) < 1) e.totalCopies = 'Enter at least 1 copy';
    if (form.publicationYear && (Number(form.publicationYear) < 1000 || Number(form.publicationYear) > new Date().getFullYear() + 1)) {
      e.publicationYear = 'Enter a valid year';
    }
    if (form.coverImage && !/^https?:\/\/\S+$/i.test(form.coverImage.trim())) e.coverImage = 'Enter a valid image URL (http or https)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setBusy(true);
    const payload = {
      title: form.title.trim(), author: form.author.trim(), isbn: form.isbn.trim(), category: form.category.trim(),
      publisher: form.publisher.trim(), description: form.description.trim(), coverImage: form.coverImage.trim(),
      totalCopies: Number(form.totalCopies),
      ...(form.publicationYear ? { publicationYear: Number(form.publicationYear) } : {}),
    };
    try {
      const res = book ? await api.put(`/books/${book._id}`, payload) : await api.post('/books', payload);
      onSaved(res.data, Boolean(book));
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (id, label, props = {}, required = false) => (
    <div className={props.col || 'col-md-6'}>
      <label htmlFor={id} className={`form-label ${required ? 'required' : ''}`}>{label}</label>
      <input id={id} className={`form-control ${errors[id] ? 'is-invalid' : ''}`} value={form[id]} onChange={set(id)} {...props.input} />
      {errors[id] && <div className="field-error">{errors[id]}</div>}
    </div>
  );

  return (
    <Modal
      title={book ? 'Edit Book' : 'Add New Book'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-light border" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="book-form" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving...' : book ? 'Save Changes' : 'Add Book'}
          </button>
        </>
      }
    >
      <form id="book-form" onSubmit={submit} noValidate>
        {serverError && <div className="alert alert-danger py-2" role="alert">{serverError}</div>}
        <div className="row g-3">
          {field('title', 'Book Title', { col: 'col-12' }, true)}
          {field('author', 'Author', {}, true)}
          {field('isbn', 'ISBN', { input: { placeholder: '10 to 20 characters' } }, true)}
          <div className="col-md-6">
            <label htmlFor="category" className="form-label required">Category</label>
            <input
              id="category" list="category-list" className={`form-control ${errors.category ? 'is-invalid' : ''}`}
              value={form.category} onChange={set('category')} placeholder="Choose or type a new one"
            />
            <datalist id="category-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            {errors.category && <div className="field-error">{errors.category}</div>}
          </div>
          {field('publisher', 'Publisher')}
          {field('publicationYear', 'Publication Year', { input: { type: 'number', placeholder: 'e.g. 2020' } })}
          {field('totalCopies', 'Total Copies', { input: { type: 'number', min: 1 } }, true)}
          {book && (
            <div className="col-12">
              <div className="form-text">Currently available: {book.availableCopies} of {book.totalCopies}. Available copies update automatically when total copies change.</div>
            </div>
          )}
          {field('coverImage', 'Cover Image URL (optional)', { col: 'col-12', input: { placeholder: 'https://...' } })}
          <div className="col-12">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea id="description" rows={3} className="form-control" value={form.description} onChange={set('description')} maxLength={2000} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
