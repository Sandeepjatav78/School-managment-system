import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api.js';
import StatCard from '../../components/StatCard.jsx';
import Donut from '../../components/Donut.jsx';
import { CalendarDays, ClipboardCheck, BookOpen, ArrowRight, Wallet } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function formatINR(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export default function StudentDashboard() {
  const [timetable, setTimetable] = useState([]);
  const [attData, setAttData] = useState({ records: [], summary: null });
  const [feeSummary, setFeeSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/student/timetable')
      .then((r) => setTimetable(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load schedule'));
    api
      .get('/student/attendance')
      .then((r) => setAttData(r.data))
      .catch(() => {});
    api
      .get('/fees/student/mine')
      .then((r) => setFeeSummary(r.data.summary))
      .catch(() => {});
  }, []);

  const today = DAYS[(new Date().getDay() + 6) % 7];
  const todaysClasses = timetable.filter((e) => e.day === today).sort((a, b) => a.period - b.period);
  const subjectsCount = new Set(timetable.map((e) => e.subject?.name)).size;

  const weekly = useMemo(() => {
    return DAYS.map((day) => {
      const records = attData.records.filter((r) => new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }) === day);
      const present = records.filter((r) => r.status === 'Present').length;
      const rate = records.length ? Math.round((present / records.length) * 100) : null;
      return { day: day.slice(0, 3), rate };
    });
  }, [attData.records]);

  const nextClass = todaysClasses.find((e) => {
    if (!e.startTime) return false;
    const [h, m] = e.startTime.split(':').map(Number);
    const now = new Date();
    return h * 60 + m > now.getHours() * 60 + now.getMinutes();
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{greeting()}</h1>
          <p>Here is your school day.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={CalendarDays} tone="indigo" value={todaysClasses.length} label="Classes today" />
        <StatCard
          icon={ClipboardCheck}
          tone="green"
          value={attData.summary ? `${attData.summary.rate}%` : '—'}
          label="Attendance"
        />
        <StatCard icon={BookOpen} tone="amber" value={subjectsCount} label="Subjects" />
        <StatCard
          icon={CalendarDays}
          tone="sky"
          value={nextClass ? `P${nextClass.period}` : '—'}
          label={nextClass ? `Next: ${nextClass.subject?.name}` : 'No more classes today'}
        />
        <StatCard
          icon={Wallet}
          tone={feeSummary && feeSummary.pendingAmount > 0 ? 'red' : 'green'}
          value={feeSummary ? formatINR(feeSummary.pendingAmount) : '—'}
          label={feeSummary && feeSummary.pendingAmount > 0 ? 'Fees pending' : 'Fees all clear'}
          sub={feeSummary && feeSummary.pendingCount > 0 ? `${feeSummary.pendingCount} month(s) due` : 'No dues'}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-pad">
            <div className="card-title">
              Today&apos;s classes ({today})
              <Link to="/student/timetable" className="btn btn-ghost btn-sm">
                Full timetable <ArrowRight size={13} />
              </Link>
            </div>
            {todaysClasses.length === 0 ? (
              <div className="empty">
                <p>No classes today.</p>
              </div>
            ) : (
              todaysClasses.map((e) => (
                <div className="list-card" key={e._id}>
                  <div className="schedule-time">
                    {e.startTime || `P${e.period}`}
                    <div style={{ fontWeight: 500, fontSize: 11, color: 'var(--text-faint)' }}>Period {e.period}</div>
                  </div>
                  <span className="subject-chip" style={{ background: `${e.subject.color}14`, color: e.subject.color }}>
                    <span className="dot" style={{ background: e.subject.color }} />
                    {e.subject.name}
                  </span>
                  <div className="grow">
                    <div className="cell-main">{e.teacher?.user?.name}</div>
                    <div className="cell-sub">Room {e.class?.room || '—'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-pad">
            <div className="card-title">My attendance</div>
            {!attData.summary || attData.summary.total === 0 ? (
              <div className="empty">
                <p>No attendance recorded yet.</p>
              </div>
            ) : (
              <>
                <div className="donut-wrap" style={{ marginBottom: 22 }}>
                  <Donut value={attData.summary.rate} size={104} />
                  <div className="donut-labels">
                    <div className="row">
                      <span className="dot" style={{ background: 'var(--green)' }} /> Present — <b>{attData.summary.present}</b>
                    </div>
                    <div className="row">
                      <span className="dot" style={{ background: 'var(--amber)' }} /> Late — <b>{attData.summary.late}</b>
                    </div>
                    <div className="row">
                      <span className="dot" style={{ background: 'var(--red)' }} /> Absent — <b>{attData.summary.absent}</b>
                    </div>
                  </div>
                </div>

                <div className="cell-sub" style={{ marginBottom: 10 }}>PRESENT THIS WEEK</div>
                <div className="bar-chart">
                  {weekly.map((w) => (
                    <div className="bar-col" key={w.day}>
                      <div className="bar-value" style={{ color: w.rate == null ? 'var(--text-faint)' : 'var(--primary)' }}>
                        {w.rate == null ? '—' : `${w.rate}%`}
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ height: `${w.rate ?? 0}%`, background: w.rate == null ? '#e6e8f0' : 'var(--primary)' }} />
                      </div>
                      <div className="bar-label">{w.day}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Link to="/student/attendance" className="btn btn-ghost btn-sm">
                    View full record <ArrowRight size={13} />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
