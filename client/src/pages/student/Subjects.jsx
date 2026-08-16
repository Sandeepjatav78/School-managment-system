import { useEffect, useState } from 'react';
import api from '../../api.js';

export default function StudentSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/student/subjects')
      .then((r) => setSubjects(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load subjects'));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My subjects</h1>
          <p>Everything you study this year.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {subjects.map((s) => (
          <div className="card" key={s._id}>
            <div className="card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="subject-chip" style={{ background: `${s.color}14`, color: s.color }}>
                  <span className="dot" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="badge gray">{s.periodsPerWeek} / wk</span>
              </div>
              <div className="cell-sub" style={{ margin: '14px 0 6px' }}>TEACHER(s)</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {s.teachers.map((t) => (
                  <span key={t} className="badge indigo">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {subjects.length === 0 && (
          <div className="card">
            <div className="empty">
              <p>No subjects published yet.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
