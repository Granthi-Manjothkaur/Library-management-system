import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', message = '', icon: Icon = Inbox, children }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={28} /></div>
      <h3>{title}</h3>
      {message && <p className="mb-2">{message}</p>}
      {children}
    </div>
  );
}
