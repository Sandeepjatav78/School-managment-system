import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { FileText, Plus, Trash2, Pencil, CalendarClock, ListChecks, Trophy } from 'lucide-react';

const EXAM_TYPES = ['Unit Test', 'Periodic Test 1', 'Periodic Test 2', 'Quarterly', 'Half Yearly', 'Pre-Board', 'Annual'];

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
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
    return api.get('/exams', { params }).then((r) => setExams(r.data));
  };

  useEffect(() => {
    Promise.all([load(), api.get('/classes'), api.get('/subjects')])
      .then(([, c, s]) => {
        setClasses(c.data);
        setSubjects(s.data);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'Periodic Test 1', class: '', startDate: '', endDate: '', subjects: [{ subject: '', maxMarks: 100, date: '' }] });
    setModal(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({
      name: e.name,
      type: e.type,
      class: e.class._id,
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      subjects: e.subjects.map((s) => ({ subject: s.subject._id, maxMarks: s.maxMarks, date: s.date || '', startTime: s.startTime || '', endTime: s.endTime || '' })),
    });
    setModal(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) await api.put(`/exams/${editing._id}`, form);
      else await api.post('/exams', form);
      setModal(false);
      showToast(editing ? 'Exam updated' : 'Exam scheduled');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save exam');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e) => {
    if (!confirm(`Delete "${e.name}" and all its marks?`)) return;
    try {
      await api.delete(`/exams/${e._id}`);
      showToast('Exam deleted');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete');
    }
  };

  const setStatus = async (e, status) => {
    try {
      if (status === 'Result Published') await api.post(`/exams/${e._id}/publish`);
      else await api.put(`/exams/${e._id}`, { status });
      showToast(`Status → ${status}`);
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update');
    }
  };

  const setSubject = (i, field, value) => {
    const subs = [...form.subjects];
    subs[i] = { ...subs[i], [field]: value };
    setForm({ ...form, subjects: subs });
  };

  const statusBadge = (s) => (s === 'Result Published' ? 'green' : s === 'Completed' ? 'sky' : s === 'In Progress' ? 'amber' : 'gray');

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Exams</h1>
          <p>Exam schedules, hall tickets and result management.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Schedule exam
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ margin: 0 }}>
          <label>Class</label>
          <select className="select" style={{ width: 190 }} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-stats">
        <StatCard icon={FileText} tone="indigo" value={exams.length} label="Exams scheduled" sub="All classes" />
        <StatCard icon={ListChecks} tone="amber" value={exams.filter((e) => e.status === 'In Progress').length} label="In progress" sub="Marks being entered" />
        <StatCard icon={Trophy} tone="green" value={exams.filter((e) => e.status === 'Result Published').length} label="Results published" sub="Rankings available" />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Exam</th>
                <th>Class</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Subjects</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e._id}>
                  <td>
                    <div className="cell-main">
                      <div className="stat-icon indigo" style={{ width: 30, height: 30 }}>
                        <CalendarClock size={14} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{e.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{e.session || `${e.startDate || ''} — ${e.endDate || ''}`}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge indigo">{e.class?.name || '—'}</span></td>
                  <td>{e.type}</td>
                  <td style={{ fontSize: 12.5 }}>
                    {fmtDate(e.startDate)} <span style={{ color: 'var(--text-faint)' }}>→</span> {fmtDate(e.endDate)}
                  </td>
                  <td>
                    <span className="badge gray">{e.subjects.length} subjects</span>
                  </td>
                  <td>
                    <select
                      className="select"
                      style={{ width: 150, padding: '5px 8px', fontSize: 12 }}
                      value={e.status}
                      onChange={(ev) => setStatus(e, ev.target.value)}
                    >
                      {['Scheduled', 'In Progress', 'Completed', 'Result Published'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>
                        <Pencil size={13} />
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => remove(e)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty"><p>No exams yet. Click “Schedule exam” to create one.</p></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal
          title={editing ? 'Edit exam' : 'Schedule an exam'}
          onClose={() => setModal(false)}
          width={560}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                {editing ? 'Save changes' : 'Schedule exam'}
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <div className="rows-gap">
            <div className="field">
              <label>Exam name</label>
              <input className="input" value={form.name} placeholder="e.g. Periodic Test 2 2026" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Type</label>
                <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {EXAM_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Class</label>
                <select className="select" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                  <option value="">Select class</option>
                  {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Start date</label>
                <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="field">
                <label>End date</label>
                <input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--text-soft)' }}>
                Subjects <span style={{ fontWeight: 400 }}>(each with max marks and date)</span>
              </label>
              {form.subjects.map((s, i) => (
                <div key={i} className="grid-3" style={{ marginBottom: 8 }}>
                  <select className="select" value={s.subject} onChange={(e) => setSubject(i, 'subject', e.target.value)}>
                    <option value="">Subject</option>
                    {subjects.map((su) => <option key={su._id} value={su._id}>{su.name}</option>)}
                  </select>
                  <input className="input" type="number" min={1} placeholder="Max marks" value={s.maxMarks} onChange={(e) => setSubject(i, 'maxMarks', e.target.value)} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className="input" type="date" value={s.date} onChange={(e) => setSubject(i, 'date', e.target.value)} />
                    {form.subjects.length > 1 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, subjects: form.subjects.filter((_, j) => j !== i) })}>✕</button>
                    )}
                  </div>
                </div>
              ))}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setForm({ ...form, subjects: [...form.subjects, { subject: '', maxMarks: 100, date: '' }] })}
              >
                + Add subject
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}