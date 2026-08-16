import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { BookOpenCheck, Plus, Trash2, Pencil, Clock } from 'lucide-react';

export default function Homework() {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () => {
    const params = {};
    if (classFilter) params.classId = classFilter;
    if (subjectFilter) params.subjectId = subjectFilter;
    return api.get('/homework', { params }).then((r) => setItems(r.data));
  };

  useEffect(() => {
    Promise.all([load(), api.get('/classes'), api.get('/subjects')])
      .then(([, c, s]) => {
        setClasses(c.data);
        setSubjects(s.data);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, subjectFilter]);

  const openCreate = () => {
    setForm({ title: '', description: '', class: '', subject: '', dueDate: '' });
    setModal(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/homework', { ...form, dueDate: form.dueDate || undefined });
      setModal(false);
      showToast('Homework assigned');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save homework');
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

  const daysLeft = (d) => {
    if (!d) return null;
    return Math.ceil((new Date(d) - new Date()) / (24 * 60 * 60 * 1000));
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Homework</h1>
          <p>Assign homework to any class, any subject.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Assign homework
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={BookOpenCheck} tone="indigo" value={items.length} label="Assignments" sub="Across all classes" />
        <StatCard
          icon={Clock}
          tone="amber"
          value={items.filter((h) => h.dueDate && daysLeft(h.dueDate) < 0).length}
          label="Overdue"
          sub="Past due date"
        />
        <StatCard icon={Plus} tone="green" value={items.filter((h) => h.dueDate && daysLeft(h.dueDate) >= 0).length} label="Upcoming" sub="Still open" />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <select className="select" style={{ width: 180 }} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All classes</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="select" style={{ width: 180 }} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Due date</th>
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
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', maxWidth: 340 }}>{h.description}</div>
                    </td>
                    <td><span className="badge indigo">{h.class?.name}</span></td>
                    <td>
                      <span className="badge" style={{ background: `${h.subject?.color}18`, color: h.subject?.color }}>
                        {h.subject?.name}
                      </span>
                    </td>
                    <td>{h.teacher?.user?.name || '—'}</td>
                    <td>
                      {h.dueDate ? (
                        <>
                          {fmtDate(h.dueDate)}
                          <div style={{ fontSize: 11.5 }}>
                            <span className={`badge ${dl < 0 ? 'red' : dl <= 1 ? 'amber' : 'green'}`} style={{ fontSize: 10.5, padding: '2px 8px' }}>
                              {dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Due today' : `${dl}d left`}
                            </span>
                          </div>
                        </>
                      ) : (
                        'No deadline'
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => remove(h)} style={{ color: 'var(--red)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty"><p>No homework assigned yet.</p></div>
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
            <div className="field">
              <label>Title</label>
              <input className="input" value={form.title} placeholder="e.g. Solve exercise 5.2" onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
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
            <div className="field">
              <label>Due date</label>
              <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}