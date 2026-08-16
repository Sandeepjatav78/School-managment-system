import { useEffect, useState } from 'react';
import api from '../../api.js';
import { CheckCheck } from 'lucide-react';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STATUSES = ['Present', 'Late', 'Absent'];

export default function TeacherAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    api
      .get('/teacher/subjects')
      .then((r) => setSubjects(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load your subjects'));
  }, []);

  useEffect(() => {
    if (!subjectId || !classId || !date) return;
    setStudents([]);
    setRecords({});
    setSaved(false);
    Promise.all([
      api.get('/teacher/class-students', { params: { classId } }),
      api.get('/attendance/for-class', { params: { date, classId, subjectId } }),
    ])
      .then(([s, a]) => {
        setStudents(s.data);
        const existing = {};
        for (const r of a.data) existing[r.student?._id] = r.status;
        setRecords(existing);
        setSaved(Object.keys(existing).length > 0);
      })
      .catch(() => {});
  }, [subjectId, classId, date]);

  const activeClass = classId ? (subjects.find((s) => s._id === subjectId)?.classes.find((c) => c._id === classId)?.name ?? '') : '';

  const setAll = (status) => {
    const next = {};
    for (const s of students) next[s.user?._id] = status;
    setRecords(next);
    setSaved(false);
  };

  const save = async () => {
    if (!subjectId || !classId || !date) return;
    setSaving(true);
    setError('');
    try {
      const payload = Object.entries(records).map(([student, status]) => ({ student, status }));
      await api.post('/attendance/mark', { date, classId, subjectId, records: payload });
      setSaved(true);
      setToast('Attendance saved');
      setTimeout(() => setToast(''), 2600);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mark attendance</h1>
          <p>Take attendance for one of your classes.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div className="field" style={{ margin: 0, minWidth: 220, flex: 1 }}>
            <label>Subject</label>
            <select className="select" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setClassId(''); }}>
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0, minWidth: 190, flex: 1 }}>
            <label>Class</label>
            <select className="select" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select class</option>
              {(subjects.find((s) => s._id === subjectId)?.classes || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0, minWidth: 170 }}>
            <label>Date</label>
            <input className="input" type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {subjectId && classId && (
        <>
          <div className="card card-pad" style={{ marginBottom: 18 }}>
            <div className="card-title">
              <span>
                {activeClass} — <span className="highlight">{subjects.find((s) => s._id === subjectId)?.name}</span>{' '}
                <span style={{ color: 'var(--text-faint)', fontWeight: 500 }}>· {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setAll('Present')}>
                <CheckCheck size={13} /> Mark all present
              </button>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll</th>
                    <th style={{ textAlign: 'right' }}>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const uid = s.user?._id;
                    const status = records[uid] || 'Present';
                    return (
                      <tr key={s._id}>
                        <td>
                          <div className="cell-main">
                            <div className="avatar sm">{s.user?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                            {s.user?.name || '—'}
                          </div>
                          <div className="cell-sub">{s.user?.email}</div>
                        </td>
                        <td className="mono">{s.rollNo ?? i + 1}</td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div className="att-pick">
                              {STATUSES.map((st) => (
                                <button
                                  key={st}
                                  className={status === st ? `on-${st[0].toLowerCase()}` : ''}
                                  onClick={() => {
                                    setRecords({ ...records, [uid]: st });
                                    setSaved(false);
                                  }}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : <CheckCheck />}
                {saved ? 'Update attendance' : 'Save attendance'}
              </button>
              {saved && <span className="badge green">Saved for this date</span>}
            </div>
          </div>
        </>
      )}
      {(!subjectId || !classId) && (
        <div className="card">
          <div className="empty">
            <p>Pick a subject and class to see the student list.</p>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
