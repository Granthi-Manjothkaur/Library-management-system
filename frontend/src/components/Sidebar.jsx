import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, BookUp, BookDown, ClipboardList, BarChart3, Library, Search, BookMarked,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/books', label: 'Books', icon: BookOpen },
  { to: '/students', label: 'Students', icon: Users },
  { section: 'Circulation' },
  { to: '/issue', label: 'Issue Book', icon: BookUp },
  { to: '/return', label: 'Return Book', icon: BookDown },
  { to: '/records', label: 'Issue Records', icon: ClipboardList },
  { section: 'Insights' },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

const studentLinks = [
  { to: '/student', label: 'My Dashboard', icon: LayoutDashboard },
  { to: '/browse', label: 'Browse Books', icon: Search },
  { to: '/my-books', label: 'My Books', icon: BookMarked },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const links = user.role === 'admin' ? adminLinks : studentLinks;

  return (
    <>
      <div className={`sidebar-backdrop ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand">
          <span className="brand-mark"><Library size={21} /></span>
          <span>Library<br /><small style={{ fontWeight: 500, color: '#93c5fd' }}>Management System</small></span>
        </div>
        <nav>
          {links.map((l, i) =>
            l.section ? (
              <div key={`s${i}`} className="sidebar-section">{l.section}</div>
            ) : (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={onClose}
                className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
              >
                <l.icon size={19} />
                {l.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="sidebar-footer">Signed in as {user.role === 'admin' ? 'Librarian' : 'Student'}</div>
      </aside>
    </>
  );
}
