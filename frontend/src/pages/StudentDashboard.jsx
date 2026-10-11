import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, AlertTriangle, IndianRupee, History, Search } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatMoney } from '../utils/format';

export default function StudentDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/student')
      .then((r) => setData(r.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loader />;
  if (!data) return <EmptyState title="Could not load your dashboard" message="Please try again in a moment." />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Hello, {user.name.split(' ')[0]}</h1>
          <p>Here is a summary of your library account.</p>
        </div>
        <Link to="/browse" className="btn btn-primary"><Search size={18} /> Browse Books</Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3"><StatCard label="Currently borrowed" value={data.currentlyBorrowed} icon={BookMarked} color="blue" /></div>
        <div className="col-12 col-sm-6 col-xl-3"><StatCard label="Overdue" value={data.overdue} icon={AlertTriangle} color="red" /></div>
        <div className="col-12 col-sm-6 col-xl-3"><StatCard label="Fine due now" value={formatMoney(data.totalFine)} icon={IndianRupee} color="orange" /></div>
        <div className="col-12 col-sm-6 col-xl-3"><StatCard label="Total borrowed" value={data.totalBorrowed} icon={History} color="purple" /></div>
      </div>

      <section className="card-box">
        <div className="card-head">
          <h2>Your books due soon</h2>
          <Link to="/my-books" className="small">See all</Link>
        </div>
        {data.dueSoon.length === 0 ? (
          <EmptyState title="No books borrowed right now" message="Visit the library desk to borrow a book." />
        ) : (
          data.dueSoon.map((i) => (
            <div key={i._id} className="activity-item align-items-center">
              <div className="activity-dot" style={{ background: 'var(--blue-100)', color: 'var(--navy-700)' }}><BookMarked size={18} /></div>
              <div className="flex-grow-1">
                <div className="fw-semibold">{i.book?.title}</div>
                <div className="cell-sub">Due {formatDate(i.dueDate)}{i.fine > 0 && ` · Fine ${formatMoney(i.fine)}`}</div>
              </div>
              <StatusBadge issue={i} />
            </div>
          ))
        )}
      </section>
    </>
  );
}
