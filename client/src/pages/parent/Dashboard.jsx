import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api.js';
import Donut from '../../components/Donut.jsx';
import { GraduationCap, ClipboardCheck, CalendarDays, Wallet, AlertCircle } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function formatINR(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/parent/children')
      .then((r) => setChildren(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load your children'));
  }, []);

  const today = DAYS[(new Date().getDay() + 6) % 7];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My children</h1>
          <p>Stay close to how your children are doing at school.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {children.length === 0 && (
        <div className="card">
          <div className="empty">
            <p>No children linked to this account yet. Ask the school to link your child.</p>
          </div>
        </div>
      )}

      {children.map((c) => <ChildCard key={c._id} child={c} today={today} />)}
    </>
  );
}

function ChildCard({ child, today }) {
  const [summary, setSummary] = useState(null);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [feeSummary, setFeeSummary] = useState(null);

  useEffect(() => {
    api
      .get('/parent/attendance', { params: { studentId: child._id } })
      .then((r) => setSummary(r.data.summary))
      .catch(() => {});
    api
      .get('/parent/timetable', { params: { studentId: child._id } })
      .then((r) => setTodaysClasses(r.data.filter((e) => e.day === today).sort((a, b) => a.period - b.period)))
      .catch(() => {});
    api
      .get(`/fees/student/${child._id}`)
      .then((r) => setFeeSummary(r.data.summary))
      .catch(() => {});
  }, [child._id, today]);

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="avatar" style={{ width: 46, height: 46, fontSize: 17 }}>
              {child.user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{child.user.name}</div>
              <div className="cell-sub">
                <span className="badge indigo">{child.class?.name || '—'}</span> Roll {child.rollNo ?? '—'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {feeSummary && feeSummary.pendingAmount > 0 && (
              <Link to={`/parent/fees?child=${child._id}`} className="badge red" style={{ textDecoration: 'none', fontSize: 12 }}>
                <AlertCircle size={12} /> Fees pending: {formatINR(feeSummary.pendingAmount)}
              </Link>
            )}
            {feeSummary && feeSummary.pendingAmount === 0 && feeSummary.totalCount > 0 && (
              <span className="badge green" style={{ fontSize: 12 }}>
                <Wallet size={12} /> Fees clear
              </span>
            )}
            <Link to={`/parent/timetable?child=${child._id}`} className="btn btn-ghost btn-sm">
              <CalendarDays size={13} /> Timetable
            </Link>
            <Link to={`/parent/attendance?child=${child._id}`} className="btn btn-ghost btn-sm">
              <ClipboardCheck size={13} /> Attendance
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="donut-wrap" style={{ background: '#f8f9fd', borderRadius: 14, padding: '14px 18px' }}>
            <Donut value={summary?.rate ?? 0} size={74} stroke={9} />
            <div className="donut-labels">
              <div className="row">Present — <b>{summary?.present ?? 0}</b></div>
              <div className="row">Absent — <b>{summary?.absent ?? 0}</b></div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="cell-sub" style={{ marginBottom: 8 }}>
              TODAY&apos;S CLASSES ({today})
            </div>
            {todaysClasses.length === 0 ? (
              <div style={{ color: 'var(--text-faint)', fontSize: 12.5 }}>No classes today.</div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {todaysClasses.map((e) => (
                  <span
                    key={e._id}
                    className="subject-chip"
                    style={{ background: `${e.subject.color}14`, color: e.subject.color }}
                  >
                    <span className="dot" style={{ background: e.subject.color }} />
                    {e.subject.name}
                    <span style={{ fontWeight: 500, opacity: 0.75 }}>· {e.startTime || `P${e.period}`}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
