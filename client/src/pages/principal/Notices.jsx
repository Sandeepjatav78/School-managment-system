import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import NoticeBoard from '../../components/NoticeBoard.jsx';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const AUDIENCES = [
  ['all', 'Everyone'],
  ['students', 'All students'],
  ['teachers', 'All teachers'],
  ['parents', 'All parents'],
  ['class', 'One class only'],
];

const emptyForm = { title: '', body: '', audience: 'all', targetClass: '' };

export default function PrincipalNotices() {
  const [notices, setNotices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = () => api.get('/notices').then((r) => setNotices(r.data));

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load notices'));
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
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

  const openEdit = (n) => {
    setEditing(n);
    setForm({
      title: n.title,
      body: n.body,
      audience: n.audience,
      targetClass: n.targetClass?._id || '',
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
        await api.put(`/notices/${editing._id}`, form);
        showToast('Notice updated');
      } else {
        await api.post('/notices', form);
        showToast('Notice published');
      }
      setModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (n) => {
    if (!window.confirm(`Delete the notice “${n.title}”?`)) return;
    try {
      await api.delete(`/notices/${n._id}`);
      showToast('Notice removed');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove notice');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Notices</h1>
          <p>{notices.length} notices on the board. Choose who sees each one.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus /> New notice
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        {notices.length === 0 ? (
          <div className="empty">
            <p>No notices yet — publish your first one.</p>
          </div>
        ) : (
          notices.map((n) => (
            <div className="list-card" key={n._id}>
              <div className="grow">
                <div className="cell-main">{n.title}</div>
                <div className="cell-sub">
                  {new Date(n.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}
                  For {n.audience === 'class' ? `class ${n.targetClass?.name || ''}` : n.audience}
                </div>
              </div>
              <button className="icon-btn" onClick={() => openEdit(n)}>
                <Pencil />
              </button>
              <button className="icon-btn danger" onClick={() => remove(n)}>
                <Trash2 />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="card-title" style={{ padding: '0 4px' }}>Preview</div>
      <NoticeBoard notices={notices} />

      {modal && (
        <Modal
          title={editing ? 'Edit notice' : 'New notice'}
          onClose={() => setModal(false)}
          width={560}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                {editing ? 'Save changes' : 'Publish notice'}
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={save}>
            <div className="field">
              <label>Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Fee reminder, exam schedule…" required />
            </div>
            <div className="field">
              <label>Message</label>
              <textarea className="input" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
            </div>
            <div className="field">
              <label>Send to</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {AUDIENCES.map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={`btn btn-sm${form.audience === value ? ' btn-primary' : ' btn-ghost'}`}
                    onClick={() => setForm({ ...form, audience: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {form.audience === 'class' && (
              <div className="field">
                <label>Class</label>
                <select className="select" value={form.targetClass} onChange={(e) => setForm({ ...form, targetClass: e.target.value })} required>
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
