import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  employeeId: '',
  phone: '',
  qualification: '',
  subjects: [],
  joinDate: '',
};

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = () =>
    api.get('/teachers').then((r) => setTeachers(r.data));
  const loadSubjects = () => api.get('/subjects').then((r) => setSubjects(r.data));

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load teachers'));
    loadSubjects().catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.user.name,
      email: t.user.email,
      password: '',
      employeeId: t.employeeId,
      phone: t.phone || '',
      qualification: t.qualification || '',
      subjects: (t.subjects || []).map((s) => s._id),
      joinDate: t.joinDate ? t.joinDate.slice(0, 10) : '',
    });
    setError('');
    setModal(true);
  };

  const toggleSubject = (id) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(id) ? f.subjects.filter((x) => x !== id) : [...f.subjects, id],
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/teachers/${editing._id}`, { ...form, password: form.password || undefined });
        showToast('Teacher updated');
      } else {
        await api.post('/teachers', form);
        showToast('Teacher added');
      }
      setModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Remove ${t.user.name}? Their timetable slots will also be deleted.`)) return;
    try {
      await api.delete(`/teachers/${t._id}`);
      showToast('Teacher removed');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove teacher');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Teachers</h1>
          <p>{teachers.length} staff members on the team.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus /> Add teacher
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Employee ID</th>
                <th>Qualification</th>
                <th>Subjects</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t._id}>
                  <td>
                    <div className="cell-main">
                      <div className="avatar sm">{t.user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                      {t.user.name}
                    </div>
                    <div className="cell-sub">{t.user.email}</div>
                  </td>
                  <td className="mono">{t.employeeId}</td>
                  <td>{t.qualification || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {(t.subjects || []).map((s) => (
                        <span key={s._id} className="badge indigo">
                          {s.name}
                        </span>
                      ))}
                      {t.subjects?.length === 0 && '—'}
                    </div>
                  </td>
                  <td>{t.joinDate ? new Date(t.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="icon-btn" onClick={() => openEdit(t)} title="Edit">
                        <Pencil />
                      </button>
                      <button className="icon-btn danger" onClick={() => remove(t)} title="Remove">
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <p>No teachers yet — add your first one.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal
          title={editing ? 'Edit teacher' : 'Add a teacher'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                {editing ? 'Save changes' : 'Add teacher'}
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={save}>
            <div className="form-row">
              <div className="field">
                <label>Full name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Email</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Password {editing && <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(leave blank to keep)</span>}</label>
                <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={6} />
              </div>
              <div className="field">
                <label>Employee ID</label>
                <input className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="field">
                <label>Joined on</label>
                <input className="input" type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Qualification</label>
              <input className="input" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
            </div>
            <div className="field">
              <label>Subjects they teach</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {subjects.map((s) => (
                  <button
                    type="button"
                    key={s._id}
                    className="subject-chip"
                    style={{
                      background: form.subjects.includes(s._id) ? s.color : '#f1f2f7',
                      color: form.subjects.includes(s._id) ? '#fff' : 'var(--text-soft)',
                      border: 'none',
                    }}
                    onClick={() => toggleSubject(s._id)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
