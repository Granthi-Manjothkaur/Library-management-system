import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

// Shows the state of an issue record: Issued / Overdue / Returned.
export default function StatusBadge({ issue }) {
  if (issue.status === 'returned') {
    return <span className="badge-soft green"><CheckCircle2 size={13} /> Returned</span>;
  }
  if (issue.isOverdue) {
    return <span className="badge-soft red"><AlertTriangle size={13} /> Overdue · {issue.overdueDays}d</span>;
  }
  return <span className="badge-soft blue"><Clock size={13} /> Issued</span>;
}

export function AvailabilityBadge({ book }) {
  return book.availableCopies > 0 ? (
    <span className="badge-soft green">{book.availableCopies} available</span>
  ) : (
    <span className="badge-soft red">Unavailable</span>
  );
}
