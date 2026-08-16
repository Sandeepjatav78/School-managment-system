import { useEffect, useState } from 'react';
import api from '../../api.js';

export default function TeacherSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/teacher/subjects')
      .then((r) => setSubjects(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load subjects'));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Subjects I teach</h1>
          <p>What you teach, and in which classes.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {subjects.map((s) => (
          <div className="card" key={s._id}>
            <div className="card-pad">
              <span className="subject-chip" style={{ background: `${s.color}14`, color: s.color, marginBottom: 14 }}>
                <span className="dot" style={{ background: s.color }} />
                {s.name}
                <span className="mono" style={{ opacity: 0.6 }}>
                  {s.code}
                </span>
              </span>
              <div className="cell-sub" style={{ marginBottom: 6 }}>CLASSES</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {s.classes.map((c) => (
                  <span key={c._id} className="badge gray">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {subjects.length === 0 && (
          <div className="card">
            <div className="empty">
              <p>No subjects assigned yet.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
