import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import { formatDate, formatMoney } from '../utils/format';

// Shared table for issue records. Pass `actions` to add an extra column.
export default function IssueTable({ issues, loading, actions, hideStudent = false, emptyTitle, emptyMessage }) {
  const columns = [
    ...(hideStudent
      ? []
      : [{
          header: 'Student',
          render: (i) => (
            <div>
              <div className="cell-title">{i.student?.name || 'Deleted student'}</div>
              <div className="cell-sub">{i.student?.studentId || '—'}</div>
            </div>
          ),
        }]),
    {
      header: 'Book',
      render: (i) => (
        <div>
          <div className="cell-title">{i.book?.title || 'Deleted book'}</div>
          <div className="cell-sub">{i.book?.author}</div>
        </div>
      ),
    },
    { header: 'Issue Date', render: (i) => formatDate(i.issueDate) },
    { header: 'Due Date', render: (i) => formatDate(i.dueDate) },
    { header: 'Return Date', render: (i) => formatDate(i.returnDate) },
    { header: 'Status', render: (i) => <StatusBadge issue={i} /> },
    {
      header: 'Fine',
      render: (i) => (
        <span className={i.fine > 0 ? 'fw-semibold text-danger' : 'text-secondary'}>{formatMoney(i.fine)}</span>
      ),
    },
    ...(actions ? [{ header: 'Actions', render: actions }] : []),
  ];
  return <DataTable columns={columns} rows={issues} loading={loading} emptyTitle={emptyTitle} emptyMessage={emptyMessage} />;
}
