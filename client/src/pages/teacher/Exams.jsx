import { useEffect, useState } from 'react';
import api from '../../api.js';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { CalendarClock, ClipboardList, CheckCircle2 } from 'lucide-react';

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/exams')
      .then((r) => setExams(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Exam Schedule</h1>
          <p>Upcoming and past examinations.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={CalendarClock} tone="indigo" value={exams.filter((e) => e.startDate >= today).length} label="Upcoming exams" sub="Across classes" />
        <StatCard icon={ClipboardList} tone="amber" value={exams.filter((e) => e.status === 'In Progress').length} label="Marks entry open" sub="You can enter your subjects" />
        <StatCard icon={CheckCircle2} tone="green" value={exams.filter((e) => e.status === 'Result Published').length} label="Results published" sub="Rankings live" />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Exam</th>
                <th>Class</th>
                <th>Dates</th>
                <th>Subjects</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{e.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{e.type}</div>
                  </td>
                  <td><span className="badge indigo">{e.class?.name}</span></td>
                  <td style={{ fontSize: 12.5 }}>{fmtDate(e.startDate)} → {fmtDate(e.endDate)}</td>
                  <td>
                    <div className="chip-row">
                      {e.subjects.map((s) => (
                        <span key={s._id} className="badge" style={{ background: `${s.subject?.color}18`, color: s.subject?.color }}>
                          {s.subject?.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td><span className={`badge ${e.status === 'Result Published' ? 'green' : e.status === 'In Progress' ? 'amber' : e.status === 'Completed' ? 'sky' : 'gray'}`}>{e.status}</span></td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty"><p>No exams scheduled.</p></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}