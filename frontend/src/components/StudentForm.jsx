import { useState } from 'react';
import Modal from './Modal';
import api, { getErrorMessage } from '../services/api';

const empty = { name: '', studentId: '', email: '', phone: '', department: '', password: '' };

// Used for both "Add student" (student = null) and "Edit student".
export default function StudentForm({ student, onClose, onSaved }) {
  const [form, setForm] = useState(student ? { ...empty, ...student, password: '' } : empty);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.studentId.trim()) e.studentId = 'Student ID is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone)) e.phone = 'Enter a valid phone number';
    if (!form.department.trim()) e.department = 'Department is required';
    if (!student && form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (student && form.password && form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setBusy(true);
    const payload = {
      name: form.name.trim(), studentId: form.studentId.trim(), email: form.email.trim(),
      phone: form.phone.trim(), department: form.department.trim(),
      ...(form.password ? { password: form.password } : {}),
    };
    try {
      const res = student ? await api.put(`/students/${student._id}`, payload) : await api.post('/students', payload);
      onSaved(res.data, Boolean(student));
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (id, label, required, extra = {}) => (
    <div className="col-md-6">
      <label htmlFor={id} className={`form-label ${required ? 'required' : ''}`}>{label}</label>
      <input id={id} className={`form-control ${errors[id] ? 'is-invalid' : ''}`} value={form[id]} onChange={set(id)} {...extra} />
      {errors[id] && <div className="field-error">{errors[id]}</div>}
    </div>
  );

  return (
    <Modal
      title={student ? 'Edit Student' : 'Add New Student'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-light border" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="student-form" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving...' : student ? 'Save Changes' : 'Add Student'}
          </button>
        </>
      }
    >
      <form id="student-form" onSubmit={submit} noValidate>
        {serverError && <div className="alert alert-danger py-2" role="alert">{serverError}</div>}
        <div className="row g-3">
          {field('name', 'Full Name', true)}
          {field('studentId', 'Student ID', true, { placeholder: 'e.g. CS2024001' })}
          {field('email', 'Email', true, { type: 'email' })}
          {field('phone', 'Phone Number', false, { type: 'tel', placeholder: '10-digit number' })}
          {field('department', 'Department', true)}
          {field(
            'password',
            student ? 'New Password (leave empty to keep)' : 'Login Password',
            !student,
            { type: 'password', autoComplete: 'new-password', placeholder: 'At least 6 characters' }
          )}
        </div>
      </form>
    </Modal>
  );
}
