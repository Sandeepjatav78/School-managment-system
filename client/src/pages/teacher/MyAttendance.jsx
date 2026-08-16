import { useEffect, useState } from 'react';
import api from '../../api.js';
import Donut from '../../components/Donut.jsx';

export default function TeacherMyAttendance() {
  const [data, setData] = useState({ records: [], summary: null });
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/teacher-attendance/mine')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load attendance'));
  }, []);

  const { records, summary } = data;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My attendance</h1>
          <p>How your days at school have looked.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {summary && summary.total > 0 && (
        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <div className="donut-wrap">
            <Donut value={summary.rate} size={92} stroke={10} color="#0891b2" />
            <div className="donut-labels">
              <div className="row">
                <span className="dot" style={{ background: 'var(--green)' }} />
                Present — <b>{summary.present}</b>
              </div>
              <div className="row">
                <span className="dot" style={{ background: 'var(--amber)' }} />
                Late — <b>{summary.late}</b>
              </div>
              <div className="row">
                <span className="dot" style={{ background: 'var(--red)' }} />
                Absent — <b>{summary.absent}</b>
              </div>
              <div className="row" style={{ color: 'var(--text-faint)' }}>
                Days marked — <b>{summary.total}</b>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div className="cell-main">
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="cell-sub">{r.date}</div>
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'Present' ? 'green' : r.status === 'Late' ? 'amber' : 'red'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={2}>
                    <div className="empty">
                      <p>No attendance marked yet by the principal.</p>
                    </div>
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
