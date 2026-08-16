import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const PRESETS = [
  ['#4f46e5', 'Indigo'],
  ['#0891b2', 'Cyan'],
  ['#059669', 'Green'],
  ['#d97706', 'Amber'],
  ['#7c3aed', 'Violet'],
  ['#db2777', 'Pink'],
  ['#dc2626', 'Red'],
  ['#64748b', 'Slate'],
];

const emptyForm = { name: '', code: '', color: '#4f46e5' };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = () => api.get('/subjects').then((r) => setSubjects(r.data));

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load subjects'));
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

  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, code: s.code, color: s.color });
    setError('');
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/subjects/${editing._id}`, form);
        showToast('Subject updated');
      } else {
        await api.post('/subjects', form);
        showToast('Subject added');
      }
      setModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete ${s.name}? Timetable entries using it will keep the old name.`)) return;
    try {
      await api.delete(`/subjects/${s._id}`);
      showToast('Subject removed');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove subject');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Subjects</h1>
          <p>{subjects.length} subjects in the catalogue.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus /> Add subject
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Code</th>
                <th>Color</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s._id}>
                  <td>
                    <span className="subject-chip" style={{ background: `${s.color}14`, color: s.color }}>
                      <span className="dot" style={{ background: s.color }} />
                      {s.name}
                    </span>
                  </td>
                  <td className="mono">{s.code}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className="dot" style={{ width: 14, height: 14, borderRadius: 5, background: s.color, display: 'inline-block' }} />
                      {s.color}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="icon-btn" onClick={() => openEdit(s)}>
                        <Pencil />
                      </button>
                      <button className="icon-btn danger" onClick={() => remove(s)}>
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="empty">
                      <p>No subjects yet — add your first one.</p>
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
          title={editing ? 'Edit subject' : 'Add a subject'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                {editing ? 'Save changes' : 'Add subject'}
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={save}>
            <div className="form-row">
              <div className="field">
                <label>Subject name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Code</label>
                <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="MATH" required />
              </div>
            </div>
            <div className="field">
              <label>Color</label>
              <div style={{ display: 'flex', gap: 9 }}>
                {PRESETS.map(([color, label]) => (
                  <button
                    type="button"
                    key={color}
                    title={label}
                    onClick={() => setForm({ ...form, color })}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      background: color,
                      border: form.color === color ? '3px solid var(--text)' : '3px solid transparent',
                      boxShadow: form.color === color ? `0 0 0 2px ${color}` : 'none',
                    }}
                  />
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
