import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { Library, LogIn, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (user) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/dashboard' : '/student'}
        replace
      />
    );
  }

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');

    if (!form.email.trim() || !form.password) {
      setServerError('Please enter your email and password.');
      return;
    }

    setBusy(true);

    try {
      const u = await login(form.email.trim(), form.password);

      if (u.role !== 'admin') {
        setServerError('Access denied. Please use the Student Login page.');
        return;
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="d-flex align-items-center gap-2 mb-4">
          <span className="brand-mark"><Library size={22} /></span>
          <strong>Library Management System</strong>
        </div>

        <h1>Admin Portal</h1>
        <p>Manage your library from one secure dashboard.</p>

        <ul className="hero-points">
          <li><ShieldCheck size={20} /> Secure administrator access</li>
          <li><Library size={20} /> Manage books and students</li>
          <li><ShieldCheck size={20} /> Track issues, returns and reports</li>
        </ul>
      </section>

      <section className="login-form-side">
        <form className="login-card" onSubmit={submit} noValidate>
          <h2 className="fw-bold mb-1">Admin Sign In</h2>
          <p className="text-secondary mb-4">
            Sign in with your administrator account.
          </p>

          {serverError && (
            <div className="alert alert-danger py-2" role="alert">
              {serverError}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="admin-email" className="form-label">
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              className="form-control"
              value={form.email}
              autoComplete="username"
              placeholder="Enter admin email"
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          <div className="mb-4">
            <label htmlFor="admin-password" className="form-label">
              Password
            </label>

            <div className="position-relative">
              <input
                id="admin-password"
                type={showPw ? 'text' : 'password'}
                className="form-control"
                value={form.password}
                autoComplete="current-password"
                placeholder="Enter password"
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />

              <button
                type="button"
                className="btn-icon position-absolute"
                style={{ right: 8, top: 7 }}
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary w-100 py-2" disabled={busy}>
            <LogIn size={18} /> {busy ? 'Signing in...' : 'Admin Sign In'}
          </button>

          <p className="text-secondary small mt-4 mb-0">
            Student? <Link to="/student-login">Go to Student Login</Link>
          </p>
        </form>
      </section>
    </div>
  );
}