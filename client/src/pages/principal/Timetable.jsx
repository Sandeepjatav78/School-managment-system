import { useEffect, useMemo, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import TimetableGrid from '../../components/TimetableGrid.jsx';
import { Plus } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DEFAULT_TIMES = {
  1: ['08:00', '08:45'],
  2: ['08:45', '09:30'],
  3: ['09:45', '10:30'],
  4: ['10:30', '11:15'],
  5: ['11:30', '12:15'],
  6: ['12:45', '13:30'],
  7: ['13:30', '14:15'],
  8: ['14:15', '15:00'],
};

const emptyForm = {
  classId: '',
  day: 'Monday',
  period: 1,
  startTime: '08:00',
  endTime: '08:45',
  subjectId: '',
  teacherId: '',
};

export default function Timetable() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [view, setView] = useState('class');
  const [selClass, setSelClass] = useState('');
  const [selTeacher, setSelTeacher] = useState('');
  const [entries, setEntries] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    Promise.all([api.get('/classes'), api.get('/teachers'), api.get('/subjects')])
      .then(([c, t, s]) => {
        setClasses(c.data);
        setTeachers(t.data);
        setSubjects(s.data);
        if (c.data.length && !selClass) setSelClass(c.data[0]._id);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load data'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEntries = () => {
    const params = view === 'class' ? { classId: selClass } : { teacherId: selTeacher };
    return api.get('/timetable', { params }).then((r) => setEntries(r.data));
  };

  useEffect(() => {
    if ((view === 'class' && selClass) || (view === 'teacher' && selTeacher)) {
      loadEntries().catch((e) => setError(e.response?.data?.message || 'Failed to load timetable'));
    } else {
      setEntries([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selClass, selTeacher]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const openCreate = () => {
    const nextPeriod = Math.max(...entries.map((e) => e.period), 0) + 1;
    setEditing(null);
    setForm({
      ...emptyForm,
      classId: view === 'class' ? selClass : '',
      teacherId: view === 'teacher' ? selTeacher : '',
      period: Math.min(nextPeriod, 8),
      startTime: DEFAULT_TIMES[Math.min(nextPeriod, 8)]?.[0] || '',
      endTime: DEFAULT_TIMES[Math.min(nextPeriod, 8)]?.[1] || '',
    });
    setError('');
    setModal(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({
      classId: e.class?._id || '',
      day: e.day,
      period: e.period,
      startTime: e.startTime || '',
      endTime: e.endTime || '',
      subjectId: e.subject?._id || '',
      teacherId: e.teacher?._id || '',
    });
    setError('');
    setModal(true);
  };

  const onPeriodChange = (p) => {
    const t = DEFAULT_TIMES[p];
    setForm((f) => ({ ...f, period: p, startTime: t?.[0] || '', endTime: t?.[1] || '' }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/timetable/${editing._id}`, form);
        showToast('Slot updated');
      } else {
        await api.post('/timetable', form);
        showToast('Slot added');
      }
      setModal(false);
      await loadEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e) => {
    if (!window.confirm(`Remove ${e.subject?.name} on ${e.day} period ${e.period}?`)) return;
    try {
      await api.delete(`/timetable/${e._id}`);
      showToast('Slot removed');
      await loadEntries();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove slot');
    }
  };

  const occupiedPeriods = useMemo(() => {
    if (view === 'class') return new Set(entries.filter((e) => e.day === form.day).map((e) => e.period));
    return new Set();
  }, [entries, form.day, view]);

  const teacherName = (id) => teachers.find((t) => t._id === id)?.user?.name;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Timetable</h1>
          <p>Plan who teaches what, where and when.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} disabled={view === 'class' ? !selClass : !selTeacher}>
          <Plus /> Add slot
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, padding: 3 }}>
          <button
            className={`btn btn-sm${view === 'class' ? ' btn-primary' : ' btn-ghost'}`}
            style={{ border: 'none', borderRadius: 999 }}
            onClick={() => setView('class')}
          >
            By class
          </button>
          <button
            className={`btn btn-sm${view === 'teacher' ? ' btn-primary' : ' btn-ghost'}`}
            style={{ border: 'none', borderRadius: 999 }}
            onClick={() => setView('teacher')}
          >
            By teacher
          </button>
        </div>

        {view === 'class' ? (
          <select className="select" style={{ width: 220 }} value={selClass} onChange={(e) => setSelClass(e.target.value)}>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <select className="select" style={{ width: 260 }} value={selTeacher} onChange={(e) => setSelTeacher(e.target.value)}>
            <option value="">Select a teacher</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.user.name} — {t.employeeId}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="card card-pad">
        {entries.length === 0 ? (
          <div className="empty">
            <p>
              {view === 'class' ? 'No timetable for this class yet.' : 'No timetable for this teacher yet.'} Use “Add slot” to
              schedule the first class.
            </p>
          </div>
        ) : (
          <TimetableGrid entries={entries} showClass={view === 'teacher'} onEdit={openEdit} onDelete={remove} />
        )}
      </div>

      {modal && (
        <Modal
          title={editing ? 'Edit slot' : 'Add a timetable slot'}
          onClose={() => setModal(false)}
          width={540}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                {editing ? 'Save changes' : 'Add slot'}
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={save}>
            <div className="field">
              <label>Class</label>
              <select className="select" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Day</label>
                <select className="select" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Period</label>
                <select className="select" value={form.period} onChange={(e) => onPeriodChange(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                    <option key={p} value={p} disabled={!editing && view === 'class' && occupiedPeriods.has(p)}>
                      Period {p} {occupiedPeriods.has(p) && !editing ? '(occupied)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Start time</label>
                <input className="input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="field">
                <label>End time</label>
                <input className="input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Subject</label>
                <select className="select" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required>
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Teacher</label>
                <select className="select" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} required>
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {editing && (
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                Editing the slot assigned to <b>{teacherName(editing.teacher?._id)}</b>.
              </div>
            )}
          </form>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
