import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Library, BookUp, Users, AlertTriangle, BookCheck, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/format';

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loader text="Loading dashboard..." />;
  if (!data) return <EmptyState title="Could not load dashboard" message="Please check that the backend server is running." />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>A live overview of your library.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/issue" className="btn btn-primary"><BookUp size={18} /> Issue Book</Link>
          <Link to="/books" className="btn btn-soft"><BookOpen size={18} /> Manage Books</Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-4"><StatCard label="Total Books (titles)" value={data.totalBooks} icon={BookOpen} color="blue" /></div>
        <div className="col-12 col-sm-6 col-xl-4"><StatCard label="Available Copies" value={data.availableCopies} icon={BookCheck} color="green" /></div>
        <div className="col-12 col-sm-6 col-xl-4"><StatCard label="Issued Books" value={data.issuedBooks} icon={Library} color="purple" /></div>
        <div className="col-12 col-sm-6 col-xl-4"><StatCard label="Registered Students" value={data.totalStudents} icon={Users} color="blue" /></div>
        <div className="col-12 col-sm-6 col-xl-4"><StatCard label="Overdue Books" value={data.overdueBooks} icon={AlertTriangle} color="red" /></div>
        <div className="col-12 col-sm-6 col-xl-4"><StatCard label="Total Copies in Library" value={data.totalCopies} icon={BookOpen} color="orange" /></div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <section className="card-box h-100">
            <div className="card-head">
              <h2>Recently Added Books</h2>
              <Link to="/books" className="small">View all</Link>
            </div>
            {(data.recentBooks || []).length === 0 ? (
              <EmptyState title="No books yet" message="Add your first book to get started." />
            ) : (
              (data.recentBooks || []).map((b) => (
                <div key={b._id} className="activity-item">
                  <div className="activity-dot" style={{ background: 'var(--blue-100)', color: 'var(--navy-700)' }}><BookOpen size={18} /></div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{b.title}</div>
                    <div className="cell-sub">{b.author} · {b.category}</div>
                  </div>
                  <div className="text-end">
                    <div className="small fw-semibold">{b.availableCopies}/{b.totalCopies}</div>
                    <div className="cell-sub">{formatDate(b.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>

        <div className="col-12 col-xl-6">
          <section className="card-box h-100">
            <div className="card-head">
              <h2>Recent Issue &amp; Return Activity</h2>
              <Link to="/records" className="small">All records</Link>
            </div>
            {(data.recentActivity || []).length === 0 ? (
              <EmptyState title="No activity yet" message="Issued and returned books will appear here." />
            ) : (
              (data.recentActivity || []).map((a) => (
                <div key={a._id} className="activity-item">
                  <div
                    className="activity-dot"
                    style={a.type === 'returned' ? { background: '#dcfce7', color: '#166534' } : { background: '#ffedd5', color: '#9a3412' }}
                  >
                    {a.type === 'returned' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{a.book?.title || 'Deleted book'}</div>
                    <div className="cell-sub">
                      {a.type === 'returned' ? 'Returned by' : 'Issued to'} {a.student?.name || 'Unknown'} ({a.student?.studentId || '—'})
                    </div>
                  </div>
                  <div className="cell-sub text-nowrap">{formatDate(a.date)}</div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </>
  );
}
