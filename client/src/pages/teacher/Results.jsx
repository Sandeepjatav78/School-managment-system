import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { Save, CheckCircle2, UserCheck } from 'lucide-react';

export default function Results() {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  useEffect(() => {
    api.get('/exams').then((r) => {
      setExams(r.data);
      if (r.data.length) setExamId(r.data[0]._id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!examId) return;
    api
      .get(`/exams/${examId}/results`)
      .then((r) => {
        setData(r.data);
        const d = {};
        for (const res of r.data.results) {
          for (const row of res.rows) {
            if (row.marksObtained != null) d[`${res.student._id}:${row.subject._id}`] = row.marksObtained;
          }
        }
        setDraft(d);
        setError('');
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load results'));
  }, [examId]);

  const saveMarks = async () => {
    setSaving(true);
    setError('');
    try {
      const items = [];
      for (const res of data.results) {
        for (const row of res.rows) {
          if (!row.editable) continue;
          const v = draft[`${res.student._id}:${row.subject._id}`];
          if (v !== undefined && v !== '') {
            items.push({ student: res.student._id, subject: row.subject._id, marksObtained: Number(v), maxMarks: row.maxMarks });
          }
        }
      }
      if (items.length === 0) {
        showToast('No marks to save for your subjects');
        return;
      }
      const r = await api.post(`/exams/${examId}/marks`, { items });
      showToast(r.data.message);
      const rr = await api.get(`/exams/${examId}/results`);
      setData(rr.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save marks');
    } finally {
      setSaving(false);
    }
  };

  const mySubjectCount = data?.results?.[0]?.rows?.filter((r) => r.editable).length || 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Marks Entry</h1>
          <p>Enter marks for subjects you teach. Others are read-only.</p>
        </div>
        <button className="btn btn-primary" onClick={saveMarks} disabled={saving || !data}>
          <Save size={15} /> Save marks
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ margin: 0 }}>
          <label>Exam</label>
          <select className="select" style={{ width: 320 }} value={examId} onChange={(e) => setExamId(e.target.value)}>
            <option value="">Select an exam</option>
            {exams.map((e) => <option key={e._id} value={e._id}>{e.name} — {e.class?.name}</option>)}
          </select>
        </div>
        {data && (
          <StatCard
            icon={UserCheck}
            tone="indigo"
            value={mySubjectCount}
            label="Subjects you can edit"
            sub={data.results.length ? `${data.results.length} students` : ''}
          />
        )}
      </div>

      {data && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  {data.exam.subjects.map((s) => (
                    <th key={s.subject._id}>
                      {s.subject.name}
                      <div style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-faint)' }}>/{s.maxMarks}</div>
                    </th>
                  ))}
                  <th>Total</th>
                  <th>%</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r) => (
                  <tr key={r.student._id}>
                    <td>{r.rollNo || '—'}</td>
                    <td>
                      <div className="cell-main">
                        <div className="avatar sm">{r.student.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                        {r.student.name}
                      </div>
                    </td>
                    {r.rows.map((row) => (
                      <td key={row.subject._id}>
                        {row.editable ? (
                          <input
                            className="marks-input"
                            type="number"
                            min={0}
                            max={row.maxMarks}
                            value={draft[`${r.student._id}:${row.subject._id}`] ?? ''}
                            placeholder="—"
                            onChange={(e) => setDraft({ ...draft, [`${r.student._id}:${row.subject._id}`]: e.target.value })}
                          />
                        ) : (
                          <span className="mono">{row.marksObtained ?? '—'}</span>
                        )}
                      </td>
                    ))}
                    <td className="mono" style={{ fontWeight: 700 }}>{r.totalObtained ?? '—'}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>{r.percentage != null ? `${r.percentage}%` : '—'}</td>
                    <td>
                      <span className="badge" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>{r.grade || '—'}</span>
                    </td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty"><p>No students in this class.</p></div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}