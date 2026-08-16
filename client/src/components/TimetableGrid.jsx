import { Fragment } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetableGrid({ entries, showClass = false, onEdit, onDelete }) {
  const periods = [];
  for (const e of entries) {
    if (!periods.includes(e.period)) periods.push(e.period);
  }
  periods.sort((a, b) => a - b);

  const byDay = {};
  for (const e of entries) {
    if (!byDay[e.day]) byDay[e.day] = {};
    byDay[e.day][e.period] = e;
  }

  const firstEntry = entries.find((e) => e.startTime);
  const periodTimes = {};
  for (const e of entries) {
    if (e.startTime && e.endTime) periodTimes[e.period] = `${e.startTime}–${e.endTime}`;
  }

  const teacherOf = (e) => e.teacher?.user?.name || '—';
  const classOf = (e) => e.class?.name || '—';

  return (
    <div className="tt-grid">
      <div className="tt-head">Period</div>
      {DAYS.map((d) => (
        <div className="tt-head" key={d}>
          {d}
        </div>
      ))}

      {periods.map((p) => (
        <Fragment key={p}>
          <div className="tt-label">
            <b>{p}</b>
            {periodTimes[p] && <span className="period-times">{periodTimes[p]}</span>}
          </div>
          {DAYS.map((d) => {
            const e = byDay[d]?.[p];
            if (!e) {
              return (
                <div className="tt-cell tt-empty" key={`${d}-${p}`}>
                  —
                </div>
              );
            }
            const color = e.subject?.color || '#4f46e5';
            return (
              <div className="tt-cell" key={`${d}-${p}`}>
                <div
                  className="tt-slot"
                  style={{
                    background: `${color}14`,
                    borderColor: `${color}44`,
                  }}
                >
                  {(onEdit || onDelete) && (
                    <div className="tt-actions">
                      {onEdit && (
                        <button className="mini-btn" onClick={() => onEdit(e)}>
                          <Pencil />
                        </button>
                      )}
                      {onDelete && (
                        <button className="mini-btn" onClick={() => onDelete(e)}>
                          <Trash2 />
                        </button>
                      )}
                    </div>
                  )}
                  <strong>
                    <span className="dot" style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                    {e.subject?.name}
                  </strong>
                  <span>{showClass ? classOf(e) : teacherOf(e)}</span>
                  {!periodTimes[p] && (e.startTime || e.endTime) && (
                    <span className="period-times">
                      {e.startTime}–{e.endTime}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </Fragment>
      ))}
      {periods.length === 0 && (
        <>
          <div className="tt-label" style={{ gridRow: 'span 5' }}>
            <b>—</b>
          </div>
          <div className="tt-empty" style={{ gridColumn: '2 / -1' }}>
            No classes scheduled yet
          </div>
        </>
      )}
    </div>
  );
}
