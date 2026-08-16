import { useEffect, useState } from 'react';
import api from '../../api.js';
import PrintDoc from '../../components/PrintDoc.jsx';
import ChildSelect from '../../components/ChildSelect.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { FileSpreadsheet, Trophy, CalendarClock } from 'lucide-react';

export default function ParentExams() {
  const [studentId, setStudentId] = useState('');
  const [child, setChild] = useState(null);
  const [exams, setExams] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    api
      .get('/parent/children')
      .then((r) => setChild(r.data.find((c) => c._id === studentId) || null))
      .catch(() => {});
    api
      .get('/exams', { params: { classId: child?.class?._id } })
      .then((r) => setExams(r.data))
      .catch(() => {});
  }, [studentId, child?.class?._id]);

  const viewResult = async (e) => {
    try {
      const r = await api.get(`/exams/${e._id}/results`, { params: { studentId } });
      setResult({ exam: e, ...r.data });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load result');
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const published = exams.filter((e) => e.status === 'Result Published');

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Exams & Results</h1>
          <p>Your child's examinations and report cards.</p>
        </div>
        <ChildSelect onChange={setStudentId} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!studentId && (
        <div className="card"><div className="empty"><p>No children linked to this account.</p></div></div>
      )}

      {studentId && (
        <>
          <div className="grid-stats">
            <StatCard icon={FileSpreadsheet} tone="indigo" value={exams.length} label="Exams scheduled" sub={child?.class?.name || ''} />
            <StatCard icon={CalendarClock} tone="amber" value={exams.filter((e) => e.status === 'In Progress').length} label="In progress" sub="Marking / exams ongoing" />
            <StatCard icon={Trophy} tone="green" value={published.length} label="Results published" sub="Tap Result to view report card" />
          </div>

          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((e) => (
                    <tr key={e._id}>
                      <td style={{ fontWeight: 600 }}>{e.name}</td>
                      <td><span className="badge indigo">{e.type}</span></td>
                      <td style={{ fontSize: 12.5 }}>{fmtDate(e.startDate)} → {fmtDate(e.endDate)}</td>
                      <td><span className={`badge ${e.status === 'Result Published' ? 'green' : e.status === 'In Progress' ? 'amber' : e.status === 'Completed' ? 'sky' : 'gray'}`}>{e.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {e.status === 'Result Published' && (
                            <button className="btn btn-primary btn-sm" onClick={() => viewResult(e)}>
                              <Trophy size={13} /> Result
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {exams.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty"><p>No exams scheduled for your child's class.</p></div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {result && (
        <PrintDoc title="Report Card" onClose={() => setResult(null)}>
          <div className="doc">
            <div className="doc-head">
              <div className="school">{result.exam.name}</div>
              <div className="addr">Type: {result.exam.type}</div>
            </div>
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
                {result.rows.map((row) => (
                  <tr key={row.subject._id}>
                    <td>{row.subject.name}</td>
                    <td style={{ textAlign: 'center' }}>{row.maxMarks}</td>
                    <td style={{ textAlign: 'center' }}>{row.marksObtained ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{row.grade || '—'}</td>
                  </tr>
                ))}
                <tr>
                  <td><strong>Total</strong></td>
                  <td style={{ textAlign: 'center' }}><strong>{result.maxTotal}</strong></td>
                  <td style={{ textAlign: 'center' }}><strong>{result.totalObtained ?? '—'}</strong></td>
                  <td style={{ textAlign: 'center' }}><strong>{result.grade || '—'}</strong></td>
                </tr>
              </tbody>
            </table>
            <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, marginTop: 8 }}>
              Percentage: {result.percentage != null ? `${result.percentage}%` : '—'}
            </div>
          </div>
        </PrintDoc>
      )}
    </>
  );
}