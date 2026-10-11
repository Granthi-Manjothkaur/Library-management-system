import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, UserX, UserCheck } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import SearchInput from '../components/SearchInput';
import StudentForm from '../components/StudentForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/format';

export default function Students() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api.get('/students', { params: { q: q || undefined, status: status || undefined } })
        .then((r) => setStudents(r.data))
        .catch((err) => toast.error(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const onSaved = (_s, wasEdit) => {
    toast.success(wasEdit ? 'Student updated successfully.' : 'Student added successfully.');
    setEditing(undefined);
    reload();
  };

  const run = async (action, okMessage, close) => {
    setBusy(true);
    try {
      await action();
      toast.success(okMessage);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      close(null);
    }
  };

  const columns = [
    {
      header: 'Student',
      render: (s) => (
        <div>
          <div className="cell-title">{s.name}</div>
          <div className="cell-sub">{s.email}</div>
        </div>
      ),
    },
    { header: 'Student ID', render: (s) => s.studentId },
    { header: 'Department', render: (s) => s.department || '—' },
    { header: 'Phone', className: 'hide-mobile', render: (s) => s.phone || '—' },
    { header: 'Registered', className: 'hide-mobile', render: (s) => formatDate(s.createdAt) },
    {
      header: 'Status',
      render: (s) => <span className={`badge-soft ${s.isActive ? 'green' : 'gray'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>,
    },
    {
      header: 'Actions',
      render: (s) => (
        <div className="d-flex gap-1">
          <button className="btn btn-soft btn-sm" onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`}><Pencil size={15} /></button>
          <button
            className="btn btn-outline-secondary btn-sm" onClick={() => setToggling(s)}
            aria-label={s.isActive ? `Deactivate ${s.name}` : `Activate ${s.name}`}
            title={s.isActive ? 'Deactivate' : 'Activate'}
          >
            {s.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
          </button>
          <button className="btn btn-outline-danger btn-sm" onClick={() => setDeleting(s)} aria-label={`Delete ${s.name}`}><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p>Register students and manage their library accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(null)}><Plus size={18} /> Add Student</button>
      </div>

      <section className="card-box">
        <div className="filter-bar">
          <SearchInput value={q} onChange={setQ} placeholder="Search by name, student ID or email" />
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All students</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <DataTable columns={columns} rows={students} loading={loading} emptyTitle="No students found" emptyMessage="Try a different search or add a new student." />
      </section>

      {editing !== undefined && <StudentForm student={editing} onClose={() => setEditing(undefined)} onSaved={onSaved} />}

      {toggling && (
        <ConfirmDialog
          title={toggling.isActive ? 'Deactivate student' : 'Activate student'} busy={busy}
          confirmText={toggling.isActive ? 'Deactivate' : 'Activate'} danger={toggling.isActive}
          message={toggling.isActive
            ? `${toggling.name} will no longer be able to log in or borrow books.`
            : `${toggling.name} will be able to log in and borrow books again.`}
          onConfirm={() => run(() => api.patch(`/students/${toggling._id}/status`), 'Student status updated.', setToggling)}
          onCancel={() => setToggling(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete student" danger busy={busy} confirmText="Delete"
          message={`Delete ${deleting.name}? Students with borrowing records cannot be deleted; deactivate them instead.`}
          onConfirm={() => run(() => api.delete(`/students/${deleting._id}`), 'Student deleted.', setDeleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
