import { useCallback, useEffect, useState } from 'react';
import { Undo2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import IssueTable from '../components/IssueTable';
import SearchInput from '../components/SearchInput';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatMoney } from '../utils/format';

export default function ReturnBook() {
  const toast = useToast();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api.get('/issues', { params: { status: onlyOverdue ? 'overdue' : 'issued', q: q || undefined } })
        .then((r) => setIssues(r.data))
        .catch((err) => toast.error(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, onlyOverdue, reloadKey]);

  const confirmReturn = useCallback(async () => {
    setBusy(true);
    try {
      const res = await api.patch(`/issues/${target._id}/return`);
      const fine = res.data.fine;
      toast.success(
        fine > 0
          ? `Returned. Late fine to collect: ${formatMoney(fine)}.`
          : `"${res.data.book.title}" returned on time. No fine.`
      );
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setReloadKey((k) => k + 1);
    } finally {
      setBusy(false);
      setTarget(null);
    }
  }, [target, toast]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Return Book</h1>
          <p>Books currently issued. Fines are calculated automatically for late returns.</p>
        </div>
      </div>

      <section className="card-box">
        <div className="filter-bar align-items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Search by student, ID or book" />
          <div className="form-check form-switch ms-1">
            <input className="form-check-input" type="checkbox" role="switch" id="overdueOnly" checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} />
            <label className="form-check-label" htmlFor="overdueOnly">Overdue only</label>
          </div>
        </div>
        <IssueTable
          issues={issues} loading={loading}
          emptyTitle={onlyOverdue ? 'No overdue books' : 'No books are currently issued'}
          emptyMessage="Everything is back on the shelf."
          actions={(i) => (
            <button className="btn btn-primary btn-sm" onClick={() => setTarget(i)}>
              <Undo2 size={15} /> Return
            </button>
          )}
        />
      </section>

      {target && (
        <ConfirmDialog
          title="Confirm return" busy={busy} confirmText="Mark as returned"
          message={
            `Return "${target.book?.title}" from ${target.student?.name}? ` +
            (target.fine > 0
              ? `This book is ${target.overdueDays} day(s) overdue. Fine to collect: ${formatMoney(target.fine)}.`
              : 'There is no fine.')
          }
          onConfirm={confirmReturn} onCancel={() => setTarget(null)}
        />
      )}
    </>
  );
}
