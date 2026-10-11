import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import {
  Library,
  LogIn,
  ShieldCheck,
  BookCheck,
  BarChart3,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
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

  const validate = () => {
    const e = {};

    if (!form.email.trim()) {
      e.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      e.email = 'Enter a valid email address';
    }

    if (!form.password) {
      e.password = 'Password is required';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');

    if (!validate()) return;

    setBusy(true);

    try {
      const u = await login(form.email.trim(), form.password);

      if (u.role !== 'student') {
        setServerError(
          'This is the Student Login page. Please use Admin Login for administrator accounts.'
        );
        return;
      }

      navigate('/student', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div
          className="d-flex align-items-center gap-2 mb-4 position-relative"
          style={{ zIndex: 1 }}
        >
          <span className="brand-mark">
            <Library size={22} />
          </span>
          <strong>Library Management System</strong>
        </div>

        <h1 style={{ position: 'relative', zIndex: 1 }}>
          Your library, at your fingertips.
        </h1>

        <p style={{ position: 'relative', zIndex: 1 }}>
          Browse books, track borrowed books, and manage your library account.
        </p>

        <ul className="hero-points">
          <li><BookCheck size={20} /> Browse available books</li>
          <li><ShieldCheck size={20} /> Secure student access</li>
          <li><BarChart3 size={20} /> Track borrowed books and due dates</li>
        </ul>
      </section>

      <section className="login-form-side">
        <form className="login-card" onSubmit={submit} noValidate>
          <h2 className="fw-bold mb-1">Student Sign In</h2>

          <p className="text-secondary mb-4">
            Sign in to access your library account.
          </p>

          {serverError && (
            <div className="alert alert-danger py-2" role="alert">
              {serverError}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Student Email Address
            </label>

            <input
              id="email"
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={form.email}
              autoComplete="username"
              placeholder="you@college.edu"
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                setErrors({ ...errors, email: '' });
              }}
            />

            {errors.email && (
              <div className="field-error">{errors.email}</div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              Password
            </label>

            <div className="position-relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                value={form.password}
                autoComplete="current-password"
                placeholder="Enter your password"
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  setErrors({ ...errors, password: '' });
                }}
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

            {errors.password && (
              <div className="field-error">{errors.password}</div>
            )}
          </div>

          <button
            className="btn btn-primary w-100 py-2"
            disabled={busy}
          >
            <LogIn size={18} />
            {busy ? 'Signing in...' : 'Student Sign In'}
          </button>

          <p className="text-secondary small mt-4 mb-0">
            Your account is created by the librarian. Need administrator access?{' '}
            <Link to="/admin-login">Go to Admin Login</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
