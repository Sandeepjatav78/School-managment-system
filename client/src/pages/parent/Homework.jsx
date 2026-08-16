import { useEffect, useState } from 'react';
import api from '../../api.js';
import ChildSelect from '../../components/ChildSelect.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { BookOpenCheck, CheckCircle2, Clock } from 'lucide-react';

export default function ParentHomework() {
  const [studentId, setStudentId] = useState('');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    api
      .get('/homework', { params: { studentId } })
      .then((r) => setItems(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, [studentId]);

  const pending = items.filter((h) => h.dueDate && new Date(h.dueDate) >= new Date());
  const submitted = items.filter((h) => h.submissions?.length);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Homework</h1>
          <p>Track your child's assignments and deadlines.</p>
        </div>
        <ChildSelect onChange={setStudentId} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!studentId && (
        <div className="card"><div className="empty"><p>No children linked to this account.</p></div></div>
      )}

      {studentId && (
        <>
          <div className="grid-stats">
            <StatCard icon={BookOpenCheck} tone="indigo" value={items.length} label="Assigned" sub="All homework" />
            <StatCard icon={Clock} tone="amber" value={pending.length} label="Pending" sub="Not yet due" />
            <StatCard icon={CheckCircle2} tone="green" value={submitted.length} label="With submissions" sub="Work handed in" />
          </div>

          <div className="grid-2">
            {items.map((h) => (
              <div className="card" key={h._id}>
                <div className="card-pad">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div className="stat-icon indigo"><BookOpenCheck /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{h.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                        <span className="badge" style={{ background: `${h.subject?.color}18`, color: h.subject?.color, marginRight: 6 }}>{h.subject?.name}</span>
                        {h.class?.name}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: '0 0 8px' }}>{h.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                    {h.dueDate ? (
                      <>
                        <Clock size={13} style={{ color: 'var(--text-faint)' }} />
                        Due {fmtDate(h.dueDate)}
                        <span className={`badge ${new Date(h.dueDate) < new Date() ? 'red' : 'green'}`}>
                          {new Date(h.dueDate) < new Date() ? 'past due' : 'open'}
                        </span>
                      </>
                    ) : (
                      <span className="badge gray">No deadline</span>
                    )}
                    {h.submissions?.length > 0 && <span className="badge sky">{h.submissions.length} submission(s)</span>}
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="card"><div className="empty"><p>No homework for your child's class yet.</p></div></div>
            )}
          </div>
        </>
      )}
    </>
  );
}