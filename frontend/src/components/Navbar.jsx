import { useEffect, useRef, useState } from 'react';
import { Menu, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close the profile menu when clicking outside it.
  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="topbar">
      <button className="btn-icon d-lg-none" onClick={onMenu} aria-label="Open menu">
        <Menu size={24} />
      </button>
      <div className="d-none d-lg-block fw-semibold text-secondary">
        {user.role === 'admin' ? 'Librarian Console' : 'Student Portal'}
      </div>
      <div className="position-relative" ref={ref}>
        <button className="profile-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
          <span className="avatar">{initials}</span>
          <span className="text-start d-none d-sm-block">
            <span className="d-block fw-semibold" style={{ fontSize: '0.9rem', lineHeight: 1.1 }}>{user.name}</span>
            <small className="text-secondary text-capitalize">{user.role}</small>
          </span>
          <ChevronDown size={16} />
        </button>
        {open && (
          <div className="profile-menu" role="menu">
            <div className="px-2 py-2 border-bottom mb-1">
              <div className="d-flex align-items-center gap-2 fw-semibold"><UserIcon size={16} /> {user.name}</div>
              <small className="text-secondary" style={{ wordBreak: 'break-all' }}>{user.email}</small>
              {user.studentId && <div><small className="text-secondary">ID: {user.studentId}</small></div>}
            </div>
            <button className="item text-danger" role="menuitem" onClick={logout}>
              <LogOut size={17} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
