import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import IssueTable from '../components/IssueTable';
import { formatMoney } from '../utils/format';

export default function MyBooks() {
  const toast = useToast();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('current');

  useEffect(() => {
    api.get('/issues/my')
      .then((r) => setIssues(r.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = issues.filter((i) => i.status === 'issued');
  const rows = view === 'current' ? current : issues;
  const fineNow = current.reduce((s, i) => s + i.fine, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My Books</h1>
          <p>Your borrowed books, due dates, fines and history.</p>
        </div>
      </div>

      {fineNow > 0 && (
        <div className="alert alert-warning" role="alert">
          You have overdue books. Fine due right now: <strong>{formatMoney(fineNow)}</strong>. Please return them at the library desk.
        </div>
      )}

      <section className="card-box">
        <div className="d-flex gap-2 p-3 border-bottom">
          <button className={`btn btn-sm ${view === 'current' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setView('current')}>
            Currently borrowed ({current.length})
          </button>
          <button className={`btn btn-sm ${view === 'history' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setView('history')}>
            Full history ({issues.length})
          </button>
        </div>
        <IssueTable
          issues={rows} loading={loading} hideStudent
          emptyTitle={view === 'current' ? 'No books borrowed right now' : 'No borrowing history yet'}
          emptyMessage="Visit the library desk to borrow a book."
        />
      </section>
    </>
  );
}
