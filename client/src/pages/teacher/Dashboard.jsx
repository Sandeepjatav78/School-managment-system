import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api.js';
import StatCard from '../../components/StatCard.jsx';
import { CalendarDays, ClipboardCheck, BookOpen, Users, UserCheck, ArrowRight } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function TeacherDashboard() {
  const [timetable, setTimetable] = useState([]);
  const [history, setHistory] = useState([]);
  const [myAttSummary, setMyAttSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/teacher/timetable')
      .then((r) => setTimetable(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load schedule'));
    api
      .get('/teacher/history')
      .then((r) => setHistory(r.data))
      .catch(() => {});
    api
      .get('/teacher-attendance/mine')
      .then((r) => setMyAttSummary(r.data.summary))
      .catch(() => {});
  }, []);

  const today = DAYS[(new Date().getDay() + 6) % 7];
  const todaysClasses = timetable.filter((e) => e.day === today).sort((a, b) => a.period - b.period);
  const classesTaught = new Set(timetable.map((e) => e.class?.name)).size;
  const periodsPerWeek = timetable.length;
  const subjectsCount = new Set(timetable.map((e) => e.subject?.name)).size;
  const lastMarked = history[0] ? new Date(history[0].date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{greeting()}</h1>
          <p>Here is your teaching day.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={CalendarDays} tone="indigo" value={todaysClasses.length} label="Classes today" />
        <StatCard icon={ClipboardCheck} tone="green" value={periodsPerWeek} label="Periods per week" />
        <StatCard icon={Users} tone="sky" value={classesTaught} label="Classes you teach" />
        <StatCard icon={BookOpen} tone="amber" value={subjectsCount} label="Subjects" />
        <StatCard
          icon={UserCheck}
          tone="red"
          value={myAttSummary && myAttSummary.total ? `${myAttSummary.rate}%` : '—'}
          label="My attendance"
          sub={myAttSummary && myAttSummary.total ? `${myAttSummary.present}/${myAttSummary.total} days present` : 'Not marked yet'}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-pad">
            <div className="card-title">
              Today&apos;s classes ({today})
              <Link to="/teacher/timetable" className="btn btn-ghost btn-sm">
                Full timetable <ArrowRight size={13} />
              </Link>
            </div>
            {todaysClasses.length === 0 ? (
              <div className="empty">
                <p>You have no classes today. Enjoy the break!</p>
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
                    <div className="cell-main">{e.class.name}</div>
                    <div className="cell-sub">Room {e.class.room || '—'}</div>
                  </div>
                  <Link to="/teacher/attendance" className="btn btn-ghost btn-sm">
                    <ClipboardCheck size={13} /> Mark
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-pad">
            <div className="card-title">Recently marked attendance</div>
            {history.length === 0 ? (
              <div className="empty">
                <p>No attendance marked yet. Head to Mark Attendance to take your first one.</p>
              </div>
            ) : (
              history.slice(0, 8).map((r) => (
                <div className="list-card" key={r._id}>
                  <div className="schedule-time">
                    {new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <div style={{ fontWeight: 500, fontSize: 11, color: 'var(--text-faint)' }}>{r.class?.name}</div>
                  </div>
                  <div className="grow">
                    <div className="cell-main">{r.subject?.name}</div>
                    <div className="cell-sub">{r.student?.name}</div>
                  </div>
                  <span className={`badge ${r.status === 'Present' ? 'green' : r.status === 'Late' ? 'amber' : 'red'}`}>
                    {r.status}
                  </span>
                </div>
              ))
            )}
            {history.length > 0 && (
              <div style={{ marginTop: 12, color: 'var(--text-faint)', fontSize: 12, fontWeight: 500 }}>
                Last marked: <b style={{ color: 'var(--text-soft)' }}>{lastMarked}</b>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
