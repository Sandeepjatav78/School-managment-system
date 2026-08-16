import { useEffect, useState } from 'react';
import api from '../../api.js';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { Inbox, Check, X, CalendarClock } from 'lucide-react';

const TYPE_COLOR = { Casual: 'sky', Sick: 'red', Earned: 'green', Medical: 'amber', Emergency: 'red', Other: 'gray' };

export default function Leaves() {
  const [data, setData] = useState({ list: [], pending: [], summary: {} });
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () => api.get('/leaves').then((r) => setData(r.data));

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const decide = async (l, decision) => {
    try {
      await api.put(`/leaves/${l._id}/decision`, { decision });
      showToast(`${l.user?.name}'s leave ${decision.toLowerCase()}`);
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update');
    }
  };

  const who = (l) => {
    if (l.role === 'teacher') return l.teacher?.user?.name || l.user?.name;
    if (l.role === 'parent') return `${l.user?.name} (for ${l.student?.name || 'child'})`;
    return l.user?.name;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Leave Management</h1>
          <p>Approve or reject leave requests from staff and students.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={Inbox} tone="amber" value={data.summary.Pending || 0} label="Pending requests" sub="Awaiting your decision" />
        <StatCard icon={Check} tone="green" value={data.summary.Approved || 0} label="Approved" sub="All time" />
        <StatCard icon={X} tone="red" value={data.summary.Rejected || 0} label="Rejected" sub="All time" />
      </div>

      {data.pending.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Pending approval</h2>
          <div className="grid-2" style={{ marginBottom: 22 }}>
            {data.pending.map((l) => (
              <div className="card" key={l._id}>
                <div className="card-pad">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div className="avatar sm">{who(l)?.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{who(l)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                        <span className={`badge ${TYPE_COLOR[l.type] || 'gray'}`} style={{ marginRight: 6 }}>{l.type}</span>
                        {l.role === 'teacher' ? 'Teacher' : l.role === 'parent' ? 'Parent (student leave)' : 'Student'}
                      </div>
                    </div>
                  </div>
                  <div className="kv"><span className="k">Dates</span><span className="v">{fmtDate(l.startDate)} → {fmtDate(l.endDate)} ({l.days} day{l.days > 1 ? 's' : ''})</span></div>
                  <div className="kv"><span className="k">Reason</span><span className="v" style={{ fontWeight: 500 }}>{l.reason}</span></div>
                  {l.remarks && <div className="kv"><span className="k">Remarks</span><span className="v" style={{ fontWeight: 500 }}>{l.remarks}</span></div>}
                  <div className="kv"><span className="k">Applied</span><span className="v">{fmtDate(l.appliedOn)}</span></div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => decide(l, 'Approved')}>
                      <Check size={13} /> Approve
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => decide(l, 'Rejected')}>
                      <X size={13} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>All requests</h2>
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Decided</th>
              </tr>
            </thead>
            <tbody>
              {data.list.map((l) => (
                <tr key={l._id}>
                  <td>
                    <div className="cell-main">
                      <div className="avatar sm">{who(l)?.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{who(l)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{l.role === 'teacher' ? 'Teacher' : l.role === 'parent' ? 'Parent' : 'Student'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${TYPE_COLOR[l.type] || 'gray'}`}>{l.type}</span></td>
                  <td style={{ fontSize: 12.5 }}>{fmtDate(l.startDate)} → {fmtDate(l.endDate)}</td>
                  <td>{l.days}</td>
                  <td style={{ fontSize: 12.5, maxWidth: 240 }}>{l.reason}</td>
                  <td><span className={`badge ${l.status === 'Approved' ? 'green' : l.status === 'Rejected' ? 'red' : 'amber'}`}>{l.status}</span></td>
                  <td style={{ fontSize: 12.5 }}>{l.approvalDate ? fmtDate(l.approvalDate) : <CalendarClock size={13} style={{ color: 'var(--text-faint)' }} />}</td>
                </tr>
              ))}
              {data.list.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty"><p>No leave requests yet.</p></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}