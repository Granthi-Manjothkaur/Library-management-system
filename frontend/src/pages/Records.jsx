import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import IssueTable from '../components/IssueTable';
import SearchInput from '../components/SearchInput';
import { downloadCSV } from '../utils/csv';
import { formatDate } from '../utils/format';

export default function Records() {
  const toast = useToast();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api.get('/issues', { params: { q: q || undefined, status: status || undefined, from: from || undefined, to: to || undefined } })
        .then((r) => setIssues(r.data))
        .catch((err) => toast.error(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, from, to]);

  const exportCsv = () => {
    if (!issues.length) return toast.error('There are no records to export.');
    downloadCSV('issue-records.csv', [
      { header: 'Student', value: (i) => i.student?.name },
      { header: 'Student ID', value: (i) => i.student?.studentId },
      { header: 'Book', value: (i) => i.book?.title },
      { header: 'Issue Date', value: (i) => formatDate(i.issueDate) },
      { header: 'Due Date', value: (i) => formatDate(i.dueDate) },
      { header: 'Return Date', value: (i) => formatDate(i.returnDate) },
      { header: 'Status', value: (i) => (i.status === 'returned' ? 'Returned' : i.isOverdue ? 'Overdue' : 'Issued') },
      { header: 'Fine (INR)', value: (i) => i.fine },
    ], issues);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Issue Records</h1>
          <p>Every book that has been issued, with due dates, returns and fines.</p>
        </div>
        <button className="btn btn-soft" onClick={exportCsv}><Download size={18} /> Export CSV</button>
      </div>

      <section className="card-box">
        <div className="filter-bar align-items-end">
          <SearchInput value={q} onChange={setQ} placeholder="Search by student, ID or book" />
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="issued">Issued (not returned)</option>
            <option value="overdue">Overdue</option>
            <option value="returned">Returned</option>
          </select>
          <div>
            <label className="form-label small mb-0" htmlFor="rf">Issued from</label>
            <input id="rf" type="date" className="form-control w-auto" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label small mb-0" htmlFor="rt">Issued to</label>
            <input id="rt" type="date" className="form-control w-auto" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </div>
          {(q || status || from || to) && (
            <button className="btn btn-light border" onClick={() => { setQ(''); setStatus(''); setFrom(''); setTo(''); }}>Clear</button>
          )}
        </div>
        <IssueTable issues={issues} loading={loading} emptyTitle="No records found" emptyMessage="Try changing the filters." />
      </section>
    </>
  );
}
