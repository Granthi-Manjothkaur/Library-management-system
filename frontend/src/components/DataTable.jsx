import Loader from './Loader';
import EmptyState from './EmptyState';

// columns: [{ header, render: (row) => node, className }]
export default function DataTable({ columns, rows, loading, emptyTitle, emptyMessage, rowKey = (r) => r._id }) {
  if (loading) return <Loader />;
  if (!rows || rows.length === 0) return <EmptyState title={emptyTitle || 'No records found'} message={emptyMessage} />;
  return (
    <div className="table-wrap">
      <table className="table data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.header} className={c.className}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)}>
              {columns.map((c) => (
                <td key={c.header} className={c.className}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
