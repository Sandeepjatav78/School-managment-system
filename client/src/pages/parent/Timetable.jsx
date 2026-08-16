import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api.js';
import TimetableGrid from '../../components/TimetableGrid.jsx';
import { GraduationCap } from 'lucide-react';

export default function ParentTimetable() {
  const [children, setChildren] = useState([]);
  const [params, setParams] = useSearchParams();
  const childId = params.get('child') || '';
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/parent/children')
      .then((r) => {
        setChildren(r.data);
        if (!childId && r.data.length) {
          setParams({ child: r.data[0]._id }, { replace: true });
        }
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load children'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!childId) {
      setEntries([]);
      return;
    }
    api
      .get('/parent/timetable', { params: { studentId: childId } })
      .then((r) => setEntries(r.data))
      .catch(() => {});
  }, [childId]);

  const activeChild = useMemo(() => children.find((c) => c._id === childId), [children, childId]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Child&apos;s timetable</h1>
          <p>Weekly schedule, just like your child sees it.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        {children.map((c) => (
          <button
            key={c._id}
            className={`btn btn-sm${c._id === childId ? ' btn-primary' : ' btn-ghost'}`}
            onClick={() => setParams({ child: c._id })}
          >
            <GraduationCap size={14} />
            {c.user.name} · {c.class?.name}
          </button>
        ))}
      </div>

      <div className="card card-pad">
        {!activeChild ? (
          <div className="empty">
            <p>No children linked to this account.</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="empty">
            <p>No timetable published for {activeChild.user.name} yet.</p>
          </div>
        ) : (
          <TimetableGrid entries={entries} />
        )}
      </div>
    </>
  );
}
