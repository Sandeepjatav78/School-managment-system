import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { BookOpenCheck, Plus, Trash2, Pencil, CheckCircle2, Clock } from 'lucide-react';

export default function Homework() {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', class: '', subject: '', dueDate: '' });
  const [submissions, setSubmissions] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () =>
    Promise.all([
      api.get('/homework', { params: { mine: 'true' } }).then((r) => setItems(r.data)),
      api.get('/classes').then((r) => setClasses(r.data)),
      api.get('/subjects').then((r) => setSubjects(r.data)),
    ]);

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/homework', { ...form, dueDate: form.dueDate || undefined });
      setModal(false);
      setForm({ title: '', description: '', class: '', subject: '', dueDate: '' });
      showToast('Homework assigned');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (h) => {
    if (!confirm(`Delete "${h.title}"?`)) return;
    try {
      await api.delete(`/homework/${h._id}`);
      showToast('Homework deleted');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete');
    }
  };

  const viewSubmissions = async (h) => {
    try {
      const r = await api.get(`/homework/${h._id}/submissions`);
      setSubmissions({ hw: h, list: r.data });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not load submissions');
    }
  };

  const check = async (s, grade) => {
    try {
      await api.post(`/homework/submissions/${s._id}/check`, { grade, remarks: grade ? `Graded ${grade}` : '' });
      showToast('Submission graded');
      const r = await api.get(`/homework/${submissions.hw._id}/submissions`);
      setSubmissions({ ...submissions, list: r.data });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not grade');
    }
  };

  const daysLeft = (d) => (d ? Math.ceil((new Date(d) - new Date()) / (24 * 60 * 60 * 1000)) : null);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Homework</h1>
          <p>Assign work and review student submissions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={15} /> Assign homework
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={BookOpenCheck} tone="indigo" value={items.length} label="My assignments" sub="All time" />
        <StatCard icon={CheckCircle2} tone="green" value={items.filter((h) => h.dueDate && daysLeft(h.dueDate) >= 0).length} label="Open" sub="Still to be submitted" />
        <StatCard icon={Clock} tone="amber" value={items.filter((h) => h.dueDate && daysLeft(h.dueDate) < 0).length} label="Overdue" sub="Past due date" />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Due</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((h) => {
                const dl = daysLeft(h.dueDate);
                return (
                  <tr key={h._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{h.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', maxWidth: 300 }}>{h.description}</div>
                    </td>
                    <td><span className="badge indigo">{h.class?.name}</span></td>
                    <td>
                      <span className="badge" style={{ background: `${h.subject?.color}18`, color: h.subject?.color }}>{h.subject?.name}</span>
                    </td>
                    <td style={{ fontSize: 12.5 }}>
                      {h.dueDate ? (
                        <>
                          {fmtDate(h.dueDate)}
                          <span className={`badge ${dl < 0 ? 'red' : dl <= 1 ? 'amber' : 'green'}`} style={{ marginLeft: 6, fontSize: 10.5, padding: '2px 8px' }}>
                            {dl < 0 ? `${Math.abs(dl)}d over` : dl === 0 ? 'today' : `${dl}d left`}
                          </span>
                        </>
                      ) : ('No deadline')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => viewSubmissions(h)}>
                          <CheckCircle2 size={13} /> Submissions
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => remove(h)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty"><p>You haven't assigned any homework yet.</p></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal
          title="Assign homework"
          onClose={() => setModal(false)}
          width={520}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                Assign
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <div className="rows-gap">
            <div className="field"><label>Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="field"><label>Description</label><textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid-2">
              <div className="field">
                <label>Class</label>
                <select className="select" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                  <option value="">Select class</option>
                  {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Subject</label>
                <select className="select" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="">Select subject</option>
                  {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="field"><label>Due date</label><input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          </div>
        </Modal>
      )}

      {submissions && (
        <Modal title={`Submissions — ${submissions.hw.title}`} onClose={() => setSubmissions(null)} width={560}>
          <div className="rows-gap">
            {submissions.list.map((s) => (
              <div key={s._id} className="notes-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div className="avatar sm">{s.student?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.student?.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Submitted {fmtDate(s.submittedAt)} · {s.status}</div>
                  </div>
                  <select className="select" style={{ width: 120, padding: '5px 8px', fontSize: 12 }} value={s.grade || ''} onChange={(e) => check(s, e.target.value)}>
                    <option value="">Grade…</option>
                    {['A+', 'A', 'B', 'C', 'D'].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: 0 }}>{s.text || 'No text submitted.'}</p>
              </div>
            ))}
            {submissions.list.length === 0 && (
              <div className="empty"><p>No submissions yet.</p></div>
            )}
          </div>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}