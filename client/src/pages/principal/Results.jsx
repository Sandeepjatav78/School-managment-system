import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import PrintDoc from '../../components/PrintDoc.jsx';
import { fmtDate, gradeColor } from '../../components/format.js';
import { FileSpreadsheet, Save, Trophy, Printer, Send } from 'lucide-react';

export default function Results() {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState({});
  const [report, setReport] = useState(null);
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
      if (!examId && r.data.length) setExamId(r.data[0]._id);
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
        showToast('No marks to save');
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

  const publish = async () => {
    try {
      await api.post(`/exams/${examId}/publish`);
      showToast('Results published — rankings released');
      const r = await api.get(`/exams/${examId}/results`);
      setData(r.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not publish');
    }
  };

  const exam = data?.exam;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Results & Marks Entry</h1>
          <p>Enter marks per subject, view report cards and publish rankings.</p>
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
            {exams.map((e) => (
              <option key={e._id} value={e._id}>{e.name} — {e.class?.name}</option>
            ))}
          </select>
        </div>
        {exam && (
          <>
            <StatCard
              icon={Trophy}
              tone="indigo"
              value={data?.results?.filter((r) => r.percentage != null).length || 0}
              label="Students marked"
              sub={`of ${data?.results?.length || 0} in ${exam.class?.name}`}
            />
            <StatCard
              icon={FileSpreadsheet}
              tone={exam.status === 'Result Published' ? 'green' : 'amber'}
              value={exam.status}
              label="Exam status"
              sub={exam.status !== 'Result Published' ? 'Publish to release ranks' : 'Rankings live'}
            />
            {exam.status !== 'Result Published' && (
              <button className="btn btn-ghost" onClick={publish}>
                <Send size={14} /> Publish results
              </button>
            )}
          </>
        )}
      </div>

      {data && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 34 }}>#</th>
                  <th>Student</th>
                  <th>Roll</th>
                  {data.exam.subjects.map((s) => (
                    <th key={s.subject._id}>
                      {s.subject.name}
                      <div style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-faint)' }}>/{s.maxMarks}</div>
                    </th>
                  ))}
                  <th>Total</th>
                  <th>%</th>
                  <th>Grade</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r) => (
                  <tr key={r.student._id}>
                    <td style={{ color: 'var(--text-faint)', fontWeight: 600 }}>{r.rank || '—'}</td>
                    <td>
                      <div className="cell-main">
                        <div className="avatar sm">{r.student.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                        {r.student.name}
                      </div>
                    </td>
                    <td>{r.rollNo || '—'}</td>
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
                    <td>{r.grade ? <span className={`badge ${gradeColor(r.grade)}`}>{r.grade}</span> : '—'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setReport(r)} title="Report card">
                        <Printer size={13} />
                      </button>
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

      {report && exam && (
        <PrintDoc title="Report Card" onClose={() => setReport(null)}>
          <div className="report-card">
            <div className="doc">
              <div className="doc-head">
                <div className="school">{exam.class?.name || ''} — Report Card</div>
                <div className="addr">Exam: {exam.name} · Type: {exam.type}</div>
              </div>
              <div className="doc-body">
                <table className="doc-table">
                  <tr>
                    <td><strong>Name:</strong> {report.student.name}</td>
                    <td><strong>Roll No:</strong> {report.rollNo || '—'}</td>
                    <td><strong>Rank:</strong> {report.rank ? `${report.rank} of ${data.results.length}` : '—'}</td>
                  </tr>
                </table>
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th style={{ textAlign: 'center' }}>Max</th>
                      <th style={{ textAlign: 'center' }}>Obtained</th>
                      <th style={{ textAlign: 'center' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row) => (
                      <tr key={row.subject._id}>
                        <td>{row.subject.name}</td>
                        <td style={{ textAlign: 'center' }}>{row.maxMarks}</td>
                        <td style={{ textAlign: 'center' }}>{row.marksObtained ?? '—'}</td>
                        <td style={{ textAlign: 'center' }}>{row.grade || '—'}</td>
                      </tr>
                    ))}
                    <tr>
                      <td><strong>Total</strong></td>
                      <td style={{ textAlign: 'center' }}><strong>{report.maxTotal}</strong></td>
                      <td style={{ textAlign: 'center' }}><strong>{report.totalObtained ?? '—'}</strong></td>
                      <td style={{ textAlign: 'center' }}><strong>{report.grade || '—'}</strong></td>
                    </tr>
                  </tbody>
                </table>
                <table className="doc-table">
                  <tr>
                    <td style={{ textAlign: 'center' }}><strong>Percentage: {report.percentage != null ? `${report.percentage}%` : '—'}</strong></td>
                    <td style={{ textAlign: 'center' }}><strong>Grade Points: {report.gradePoints != null ? report.gradePoints.toFixed(2) : '—'}</strong></td>
                  </tr>
                </table>
                <div className="doc-sign">
                  <div className="line">Class Teacher</div>
                  <div className="line">Principal</div>
                  <div className="line">Parent's Signature</div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#888', marginTop: 16 }}>
                  Generated on {fmtDate(new Date())} — {exam.session || ''}
                </div>
              </div>
            </div>
          </div>
        </PrintDoc>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}