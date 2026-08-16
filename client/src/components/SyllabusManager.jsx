import { useEffect, useState } from 'react';
import api from '../api.js';
import Modal from './Modal.jsx';
import { BookMarked, Plus, Trash2, CheckCircle2, PlayCircle, CircleDashed } from 'lucide-react';

const STATUS_ICON = { Completed: CheckCircle2, Ongoing: PlayCircle, Planned: CircleDashed };
const STATUS_CLASS = { Completed: 'green', Ongoing: 'amber', Planned: 'gray' };

export default function SyllabusManager({ mine = false }) {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [chapterForm, setChapterForm] = useState({ title: '', status: 'Planned', week: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () => {
    const params = { mine: String(mine) };
    if (classFilter) params.classId = classFilter;
    if (subjectFilter) params.subjectId = subjectFilter;
    return api.get('/syllabus', { params }).then((r) => setItems(r.data));
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

  const openModal = (item) => {
    setModal(item);
    setChapterForm({ title: '', status: 'Planned', week: '' });
  };

  const addChapter = async () => {
    if (!chapterForm.title) return;
    setSaving(true);
    setError('');
    try {
      const updated = await api.post(`/syllabus/${modal._id}/chapters`, chapterForm);
      setItems((prev) => prev.map((i) => (i._id === updated.data._id ? updated.data : i)));
      setModal(updated.data);
      setChapterForm({ title: '', status: 'Planned', week: '' });
      showToast('Chapter added');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add chapter');
    } finally {
      setSaving(false);
    }
  };

  const setChapterStatus = async (ch, status) => {
    try {
      const updated = await api.put(`/syllabus/${modal._id}/chapters/${ch._id}`, { status });
      setItems((prev) => prev.map((i) => (i._id === updated.data._id ? updated.data : i)));
      setModal(updated.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update');
    }
  };

  const removeChapter = async (ch) => {
    if (!confirm(`Remove chapter "${ch.title}"?`)) return;
    try {
      const updated = await api.delete(`/syllabus/${modal._id}/chapters/${ch._id}`);
      setItems((prev) => prev.map((i) => (i._id === updated.data._id ? updated.data : i)));
      setModal(updated.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Syllabus & Lesson Plans</h1>
          <p>Chapter-wise syllabus {mine ? 'for the subjects you teach.' : 'for every class and subject.'}</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

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

      <div className="grid-3">
        {items.map((item) => {
          const done = item.chapters.filter((c) => c.status === 'Completed').length;
          const ongoing = item.chapters.filter((c) => c.status === 'Ongoing').length;
          return (
            <div className="card" key={item._id} style={{ cursor: 'pointer' }} onClick={() => openModal(item)}>
              <div className="card-pad" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="stat-icon indigo">
                    <BookMarked />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.subject?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                      {item.class?.name} · {item.teacher?.user?.name || 'No teacher'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
                  {done} completed · {ongoing} ongoing · {item.chapters.length - done - ongoing} planned
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                  {item.chapters.map((c) => (
                    <span key={c._id} className={`badge ${STATUS_CLASS[c.status]}`} style={{ width: 8, height: 8, padding: 0, borderRadius: 99 }} title={c.title} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="card">
            <div className="empty"><p>No syllabus plans for this selection.</p></div>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={`${modal.subject?.name} — ${modal.class?.name}`}
          onClose={() => setModal(null)}
          width={560}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Close</button>
              <button className="btn btn-primary" onClick={addChapter} disabled={saving || !chapterForm.title}>
                <Plus size={14} /> Add chapter
              </button>
            </>
          }
        >
          <div className="rows-gap">
            <div className="grid-3">
              <div className="field">
                <label>Chapter title</label>
                <input className="input" value={chapterForm.title} placeholder="e.g. Quadratic Equations" onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })} />
              </div>
              <div className="field">
                <label>Status</label>
                <select className="select" value={chapterForm.status} onChange={(e) => setChapterForm({ ...chapterForm, status: e.target.value })}>
                  <option>Planned</option>
                  <option>Ongoing</option>
                  <option>Completed</option>
                </select>
              </div>
              <div className="field">
                <label>Weeks</label>
                <input className="input" value={chapterForm.week} placeholder="e.g. Weeks 1-3" onChange={(e) => setChapterForm({ ...chapterForm, week: e.target.value })} />
              </div>
            </div>
            <div>
              {modal.chapters.map((ch) => {
                const Icon = STATUS_ICON[ch.status];
                return (
                  <div key={ch._id} className="list-card" style={{ padding: '10px 4px' }}>
                    <button
                      className="icon-btn"
                      title={`Mark ${ch.status === 'Completed' ? 'Ongoing' : 'Completed'}`}
                      onClick={() => setChapterStatus(ch, ch.status === 'Completed' ? 'Ongoing' : 'Completed')}
                    >
                      <Icon size={15} color={ch.status === 'Completed' ? 'var(--green)' : ch.status === 'Ongoing' ? 'var(--amber)' : 'var(--text-faint)'} />
                    </button>
                    <div className="grow">
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{ch.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{ch.week || ''} · {ch.status}</div>
                    </div>
                    <button className="icon-btn" onClick={() => removeChapter(ch)} style={{ color: 'var(--red)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {modal.chapters.length === 0 && (
                <div className="empty" style={{ padding: 24 }}>
                  <p>No chapters yet — add the first one above.</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}