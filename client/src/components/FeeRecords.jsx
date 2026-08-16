import { Wallet, CheckCircle2, AlertCircle } from 'lucide-react';

export function formatINR(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export function monthLabel(month) {
  const [y, m] = String(month).split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function FeeRecords({ records = [], summary }) {
  if (!records || records.length === 0) {
    return (
      <div className="empty">
        <p>No fee records yet.</p>
      </div>
    );
  }

  return (
    <>
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 18 }}>
          <div className="stat-card">
            <div className="stat-icon red">
              <AlertCircle />
            </div>
            <div>
              <div className="stat-value">{formatINR(summary.pendingAmount)}</div>
              <div className="stat-label">
                Pending {summary.pendingCount > 0 ? `· ${summary.pendingCount} month${summary.pendingCount > 1 ? 's' : ''}` : ''}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <CheckCircle2 />
            </div>
            <div>
              <div className="stat-value">{formatINR(summary.paidAmount)}</div>
              <div className="stat-label">Paid · {summary.paidCount} month{summary.paidCount !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Paid on</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div className="cell-main">
                      <Wallet size={14} style={{ color: 'var(--text-faint)' }} />
                      {monthLabel(r.month)}
                    </div>
                  </td>
                  <td className="mono" style={{ fontWeight: 600 }}>{formatINR(r.amount)}</td>
                  <td>
                    {r.paidDate
                      ? new Date(r.paidDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'Paid' ? 'green' : 'red'}`}>
                      {r.status === 'Paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
