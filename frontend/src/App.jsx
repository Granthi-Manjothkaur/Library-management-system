import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';

import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';

import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Students from './pages/Students';
import IssueBook from './pages/IssueBook';
import ReturnBook from './pages/ReturnBook';
import Records from './pages/Records';
import Reports from './pages/Reports';

import StudentDashboard from './pages/StudentDashboard';
import BrowseBooks from './pages/BrowseBooks';
import MyBooks from './pages/MyBooks';

function Home() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <Navigate
      to={user.role === 'admin' ? '/dashboard' : '/student'}
      replace
    />
  );
}

export default function App() {
  return (
    <Routes>
      {/* Separate login pages */}
      <Route
        path="/login"
        element={<Navigate to="/admin-login" replace />}
      />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/student-login" element={<Login />} />

      {/* Home page */}
      <Route path="/" element={<Home />} />

      {/* Admin pages */}
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/books" element={<Books />} />
          <Route path="/students" element={<Students />} />
          <Route path="/issue" element={<IssueBook />} />
          <Route path="/return" element={<ReturnBook />} />
          <Route path="/records" element={<Records />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Route>

      {/* Student pages */}
      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route element={<Layout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/browse" element={<BrowseBooks />} />
          <Route path="/my-books" element={<MyBooks />} />
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}