import Donut from './Donut.jsx';

const STATUS_BADGE = {
  Present: 'green',
  Absent: 'red',
  Late: 'amber',
};

export default function AttendanceHistory({ records = [], summary }) {
  if (!records || records.length === 0) {
    return (
      <div className="empty">
        <p>No attendance recorded yet.</p>
      </div>
    );
  }

  return (
    <>
      {summary && (
        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <div className="donut-wrap">
            <Donut value={summary.rate} size={92} stroke={10} color="#4f46e5" />
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
                Total sessions — <b>{summary.total}</b>
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
                <th>Subject</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const d = new Date(r.date + 'T00:00:00');
                return (
                  <tr key={r._id}>
                    <td>
                      <div className="cell-main">{d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                      <div className="cell-sub">{r.date}</div>
                    </td>
                    <td>
                      <span
                        className="subject-chip"
                        style={{ background: `${r.subject?.color || '#4f46e5'}14`, color: r.subject?.color || '#4f46e5' }}
                      >
                        <span className="dot" style={{ background: r.subject?.color || '#4f46e5' }} />
                        {r.subject?.name || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
