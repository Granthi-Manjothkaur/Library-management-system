import { useEffect, useState } from 'react';
import { Download, Boxes, AlertTriangle, TrendingUp, History } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import IssueTable from '../components/IssueTable';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { downloadCSV } from '../utils/csv';
import { formatDate } from '../utils/format';

const TABS = [
  { id: 'inventory', label: 'Books & Availability', icon: Boxes },
  { id: 'overdue', label: 'Overdue Books', icon: AlertTriangle },
  { id: 'popular', label: 'Most Borrowed', icon: TrendingUp },
  { id: 'history', label: 'Student History', icon: History },
];

const statusText = (i) => (i.status === 'returned' ? 'Returned' : i.isOverdue ? 'Overdue' : 'Issued');

export default function Reports() {
  const toast = useToast();
  const [tab, setTab] = useState('inventory');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students').then((r) => setStudents(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setData(null);
    if (tab === 'history' && !studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const dates = { from: from || undefined, to: to || undefined };
    const request = {
      inventory: () => api.get('/reports/books'),
      overdue: () => api.get('/reports/overdue'),
      popular: () => api.get('/reports/most-borrowed', { params: dates }),
      history: () => api.get(`/reports/student-history/${studentId}`, { params: dates }),
    }[tab];
    request()
      .then((r) => setData(r.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, from, to, studentId]);

  const issueCols = [
    { header: 'Student', value: (i) => i.student?.name },
    { header: 'Student ID', value: (i) => i.student?.studentId },
    { header: 'Book', value: (i) => i.book?.title },
    { header: 'Issue Date', value: (i) => formatDate(i.issueDate) },
    { header: 'Due Date', value: (i) => formatDate(i.dueDate) },
    { header: 'Return Date', value: (i) => formatDate(i.returnDate) },
    { header: 'Status', value: statusText },
    { header: 'Fine (INR)', value: (i) => i.fine },
  ];

  const exportCsv = () => {
    if (tab === 'inventory') {
      if (!data?.rows.length) return toast.error('Nothing to export.');
      downloadCSV('books-report.csv', [
        { header: 'Title', value: (r) => r.title }, { header: 'Author', value: (r) => r.author },
        { header: 'ISBN', value: (r) => r.isbn }, { header: 'Category', value: (r) => r.category },
        { header: 'Total Copies', value: (r) => r.totalCopies }, { header: 'Available', value: (r) => r.availableCopies },
        { header: 'Issued', value: (r) => r.issuedCopies },
      ], data.rows);
    } else if (tab === 'popular') {
      if (!data?.length) return toast.error('Nothing to export.');
      downloadCSV('most-borrowed-books.csv', [
        { header: 'Title', value: (r) => r.title }, { header: 'Author', value: (r) => r.author },
        { header: 'ISBN', value: (r) => r.isbn }, { header: 'Category', value: (r) => r.category },
        { header: 'Times Borrowed', value: (r) => r.timesBorrowed },
      ], data);
    } else {
      if (!data?.length) return toast.error('Nothing to export.');
      downloadCSV(tab === 'overdue' ? 'overdue-books.csv' : 'student-history.csv', issueCols, data);
    }
  };

  const showDates = tab === 'popular' || tab === 'history';

  const renderBody = () => {
    if (tab === 'history' && !studentId) {
      return <EmptyState title="Choose a student" message="Select a student above to see their borrowing history." icon={History} />;
    }
    if (loading) return <Loader />;
    if (!data) return null;

    if (tab === 'inventory') {
      return (
        <>
          <div className="row g-3 p-3">
            <div className="col-6 col-lg-3"><StatCard label="Book titles" value={data.totals.titles} icon={Boxes} color="blue" /></div>
            <div className="col-6 col-lg-3"><StatCard label="Total copies" value={data.totals.totalCopies} icon={Boxes} color="orange" /></div>
            <div className="col-6 col-lg-3"><StatCard label="Available" value={data.totals.availableCopies} icon={Boxes} color="green" /></div>
            <div className="col-6 col-lg-3"><StatCard label="Issued" value={data.totals.issuedCopies} icon={Boxes} color="purple" /></div>
          </div>
          <DataTable
            rows={data.rows} emptyTitle="No books in the library"
            columns={[
              { header: 'Title', render: (r) => <span className="cell-title">{r.title}</span> },
              { header: 'Author', render: (r) => r.author },
              { header: 'Category', render: (r) => r.category },
              { header: 'Total', render: (r) => r.totalCopies },
              { header: 'Available', render: (r) => r.availableCopies },
              { header: 'Issued', render: (r) => r.issuedCopies },
            ]}
          />
        </>
      );
    }
    if (tab === 'popular') {
      return (
        <DataTable
          rows={data} emptyTitle="No borrowing data" emptyMessage="Nothing was borrowed in this period."
          columns={[
            { header: '#', render: (r) => data.indexOf(r) + 1 },
            { header: 'Title', render: (r) => <span className="cell-title">{r.title}</span> },
            { header: 'Author', render: (r) => r.author },
            { header: 'Category', render: (r) => r.category },
            { header: 'Times Borrowed', render: (r) => <span className="badge-soft blue">{r.timesBorrowed}</span> },
          ]}
        />
      );
    }
    return (
      <IssueTable
        issues={data} loading={false}
        emptyTitle={tab === 'overdue' ? 'No overdue books' : 'No borrowing history'}
        emptyMessage={tab === 'overdue' ? 'Great! Nothing is overdue.' : 'No records in this period.'}
      />
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Inventory, overdue books, popular titles and student history.</p>
        </div>
        <button className="btn btn-soft" onClick={exportCsv}><Download size={18} /> Export CSV</button>
      </div>

      <section className="card-box">
        <div className="d-flex flex-wrap gap-2 p-3 border-bottom" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id} role="tab" aria-selected={tab === t.id}
              className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-soft'}`} onClick={() => setTab(t.id)}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {(showDates || tab === 'history') && (
          <div className="filter-bar align-items-end">
            {tab === 'history' && (
              <div>
                <label className="form-label small mb-0" htmlFor="rs">Student</label>
                <select id="rs" className="form-select" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                  <option value="">Select a student...</option>
                  {students.map((s) => <option key={s._id} value={s._id}>{s.name} — {s.studentId}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="form-label small mb-0" htmlFor="df">From</label>
              <input id="df" type="date" className="form-control w-auto" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="form-label small mb-0" htmlFor="dt">To</label>
              <input id="dt" type="date" className="form-control w-auto" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </div>
            {(from || to) && <button className="btn btn-light border" onClick={() => { setFrom(''); setTo(''); }}>Clear dates</button>}
          </div>
        )}

        {renderBody()}
      </section>
    </>
  );
}
