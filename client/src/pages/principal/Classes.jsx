import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

const emptyForm = { name: '', room: '', classTeacher: '', capacity: 40 };

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = () => api.get('/classes').then((r) => setClasses(r.data));

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load classes'));
    api.get('/teachers').then((r) => setTeachers(r.data)).catch(() => {});
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

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name,
      room: c.room || '',
      classTeacher: c.classTeacher?._id || '',
      capacity: c.capacity ?? 40,
    });
    setError('');
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/classes/${editing._id}`, form);
        showToast('Class updated');
      } else {
        await api.post('/classes', form);
        showToast('Class created');
      }
      setModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.name}?`)) return;
    try {
      await api.delete(`/classes/${c._id}`);
      showToast('Class removed');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove class');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Classes</h1>
          <p>{classes.length} classes across the school.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus /> Add class
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {classes.map((c) => (
          <div className="card" key={c._id}>
            <div className="card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{c.name}</div>
                  <div className="cell-sub" style={{ marginTop: 3 }}>{c.room || 'No room assigned'}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="icon-btn" onClick={() => openEdit(c)}>
                    <Pencil />
                  </button>
                  <button className="icon-btn danger" onClick={() => remove(c)}>
                    <Trash2 />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 22, marginTop: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-faint)', fontSize: 11.5, fontWeight: 600 }}>
                    <Users size={13} /> STUDENTS
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginTop: 3 }}>
                    {c.studentCount}
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-faint)' }}> / {c.capacity}</span>
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-faint)', fontSize: 11.5, fontWeight: 600 }}>CLASS TEACHER</div>
                  <div style={{ fontWeight: 600, marginTop: 5, fontSize: 13 }}>
                    {c.classTeacher?.user?.name || 'Not assigned'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="card">
            <div className="empty">
              <p>No classes yet — create your first one.</p>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={editing ? 'Edit class' : 'Add a class'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                {editing ? 'Save changes' : 'Create class'}
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={save}>
            <div className="form-row">
              <div className="field">
                <label>Class name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Grade 6-A" required />
              </div>
              <div className="field">
                <label>Room</label>
                <input className="input" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Room 106" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Class teacher</label>
                <select className="select" value={form.classTeacher} onChange={(e) => setForm({ ...form, classTeacher: e.target.value })}>
                  <option value="">Not assigned</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Capacity</label>
                <input className="input" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
