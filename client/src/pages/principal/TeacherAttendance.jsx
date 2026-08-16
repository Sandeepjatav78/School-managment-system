import { useEffect, useState } from 'react';
import api from '../../api.js';
import StatCard from '../../components/StatCard.jsx';
import { CheckCheck, UserCheck, Users, AlertTriangle, Clock } from 'lucide-react';

const STATUSES = ['Present', 'Late', 'Absent'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TeacherAttendance() {
  const [date, setDate] = useState(todayStr());
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = () => {
    api
      .get('/teacher-attendance', { params: { date } })
      .then((r) => {
        setRecords(r.data.records);
        setSummary(r.data.summary);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load teacher attendance'));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const setAll = (status) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = records.map((r) => ({ teacher: r.teacher._id, status: r.status }));
      await api.post('/teacher-attendance/mark', { date, records: payload });
      showToast('Attendance saved');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save attendance');
    } finally {
      setSaving(false);
    }
  };

  const edited = summary ? records.some((r) => r.status !== 'Present') : false;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Teacher attendance</h1>
          <p>Mark which staff are in today.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={UserCheck} tone="green" value={summary?.present ?? '—'} label="Present" />
        <StatCard icon={Clock} tone="amber" value={summary?.late ?? '—'} label="Late" />
        <StatCard icon={AlertTriangle} tone="red" value={summary?.absent ?? '—'} label="Absent" />
        <StatCard
          icon={Users}
          tone="indigo"
          value={summary ? `${summary.rate ?? '—'}%` : '—'}
          label="Attendance rate"
          sub={summary ? `${summary.present + summary.late}/${summary.total} in school` : ''}
        />
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Date</label>
            <input className="input" type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button className="btn btn-ghost" onClick={() => setAll('Present')}>
            <CheckCheck size={14} /> Mark all present
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={save} disabled={saving || !edited}>
            {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : <CheckCheck />}
            Save attendance
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Employee ID</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const status = r.status;
                return (
                  <tr key={r._id}>
                    <td>
                      <div className="cell-main">
                        <div className="avatar sm">{r.teacher?.user?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                        {r.teacher?.user?.name || '—'}
                      </div>
                      <div className="cell-sub">{r.teacher?.user?.email}</div>
                    </td>
                    <td className="mono">{r.teacher?.employeeId || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div className="att-pick">
                          {STATUSES.map((st) => (
                            <button
                              key={st}
                              className={status === st ? `on-${st[0].toLowerCase()}` : ''}
                              onClick={() => {
                                setRecords((prev) =>
                                  prev.map((x) => (x._id === r._id ? { ...x, status: st } : x))
                                );
                              }}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={3}>
                    <div className="empty">
                      <p>No teachers registered yet.</p>
                    </div>
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
