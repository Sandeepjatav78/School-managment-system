import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api.js';

export default function ChildSelect({ onChange }) {
  const [children, setChildren] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('child') || '';

  useEffect(() => {
    api
      .get('/parent/children')
      .then((r) => {
        setChildren(r.data);
        if (r.data.length && !r.data.some((c) => c._id === active)) {
          setSearchParams({ child: r.data[0]._id }, { replace: true });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    onChange(active);
  }, [active, onChange]);

  if (!children.length) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 13, color: 'var(--text-soft)', fontWeight: 600 }}>Child</span>
      <select
        className="select"
        style={{ width: 'auto', minWidth: 180 }}
        value={active}
        onChange={(e) => setSearchParams({ child: e.target.value }, { replace: true })}
      >
        {children.map((c) => (
          <option key={c._id} value={c._id}>
            {c.user.name} — {c.class?.name || 'Class'}
          </option>
        ))}
      </select>
    </div>
  );
}