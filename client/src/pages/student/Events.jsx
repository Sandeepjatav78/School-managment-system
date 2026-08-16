import { useEffect, useState } from 'react';
import api from '../../api.js';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { CalendarDays, PartyPopper, Palmtree } from 'lucide-react';

const TYPE_ICON = { Academic: CalendarDays, Cultural: PartyPopper, Sports: PartyPopper, Holiday: Palmtree, Meeting: CalendarDays, Exam: CalendarDays, Other: CalendarDays };

export default function Events() {
  const [list, setList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/events', { params: { upcoming: 'true' } })
      .then((r) => setList(r.data.list))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const holidays = list.filter((e) => e.isHoliday).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Events</h1>
          <p>Upcoming functions, activities and holidays.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={CalendarDays} tone="indigo" value={list.length} label="Upcoming events" sub="From today" />
        <StatCard icon={Palmtree} tone="amber" value={holidays} label="Holidays ahead" sub="Plan your vacations!" />
        <StatCard icon={PartyPopper} tone="green" value={list.filter((e) => !e.isHoliday).length} label="Functions & activities" sub="Cultural, sports & academic" />
      </div>

      <div className="grid-2">
        {list.map((e) => {
          const Icon = TYPE_ICON[e.type] || CalendarDays;
          return (
            <div className="card" key={e._id}>
              <div className="card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className={`stat-icon ${e.isHoliday ? 'amber' : e.type === 'Cultural' || e.type === 'Sports' ? 'green' : 'indigo'}`}>
                    <Icon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>
                      {e.title}
                      {e.isHoliday && <span className="badge amber" style={{ marginLeft: 8 }}>Holiday</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                      {fmtDate(e.date)} {e.startTime && `· ${e.startTime}${e.endTime ? `–${e.endTime}` : ''}`} {e.venue && `· ${e.venue}`}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: 0 }}>
                  <span className="badge indigo" style={{ marginRight: 8 }}>{e.type}</span>
                  {e.description}
                </p>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="card"><div className="empty"><p>No upcoming events.</p></div></div>
        )}
      </div>
    </>
  );
}