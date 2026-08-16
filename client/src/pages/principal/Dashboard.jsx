import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api.js';
import StatCard from '../../components/StatCard.jsx';
import { Users, GraduationCap, School, BookOpen, ClipboardCheck, ArrowRight } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function PrincipalDashboard() {
  const [stats, setStats] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/stats/dashboard')
      .then((r) => setStats(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load dashboard'));
    api
      .get('/stats/today-classes')
      .then((r) => setTodayClasses(r.data))
      .catch(() => {});
  }, []);

  const today = DAYS[(new Date().getDay() + 6) % 7];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{greeting()}</h1>
          <p>Here is how the school is doing today.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={GraduationCap} tone="indigo" value={stats?.studentCount ?? '—'} label="Total students" />
        <StatCard icon={Users} tone="sky" value={stats?.teacherCount ?? '—'} label="Total teachers" />
        <StatCard icon={School} tone="green" value={stats?.classCount ?? '—'} label="Classes" />
        <StatCard icon={BookOpen} tone="amber" value={stats?.subjectCount ?? '—'} label="Subjects" />
        <StatCard
          icon={ClipboardCheck}
          tone="red"
          value={stats ? `${stats.todayAttendance.rate}%` : '—'}
          label="Attendance today"
          sub={
            stats && stats.todayAttendance.total
              ? `${stats.todayAttendance.present}/${stats.todayAttendance.total} present`
              : 'No attendance marked yet today'
          }
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-pad">
            <div className="card-title">
              Today&apos;s classes ({today})
              <Link to="/principal/timetable" className="btn btn-ghost btn-sm">
                Open timetable <ArrowRight size={13} />
              </Link>
            </div>
            {todayClasses.length === 0 ? (
              <div className="empty">
                <p>No classes scheduled for today.</p>
              </div>
            ) : (
              <div>
                {todayClasses.slice(0, 12).map((e) => (
                  <div className="list-card" key={e._id}>
                    <div className="schedule-time">
                      {e.startTime}
                      <div style={{ fontWeight: 500, fontSize: 11, color: 'var(--text-faint)' }}>P{e.period}</div>
                    </div>
                    <span
                      className="subject-chip"
                      style={{ background: `${e.subject.color}14`, color: e.subject.color }}
                    >
                      <span className="dot" style={{ background: e.subject.color }} />
                      {e.subject.name}
                    </span>
                    <div className="grow">
                      <div className="cell-main">{e.class.name}</div>
                      <div className="cell-sub">{e.teacher?.user?.name}</div>
                    </div>
                    <span className="badge gray">Room {e.class.room || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-pad">
            <div className="card-title">Quick actions</div>
            {[
              ['Add a teacher', '/principal/teachers'],
              ['Enroll a student', '/principal/students'],
              ['Set up a class', '/principal/classes'],
              ['Plan the timetable', '/principal/timetable'],
            ].map(([label, to]) => (
              <Link
                key={to}
                to={to}
                className="list-card"
                style={{ textDecoration: 'none' }}
              >
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{label}</div>
                </div>
                <ArrowRight size={15} style={{ color: 'var(--text-faint)' }} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
