import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api.js';
import FeeRecords from '../../components/FeeRecords.jsx';
import { GraduationCap } from 'lucide-react';

export default function ParentFees() {
  const [children, setChildren] = useState([]);
  const [params, setParams] = useSearchParams();
  const childId = params.get('child') || '';
  const [data, setData] = useState({ records: [], summary: null });
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
    if (!childId) return;
    api
      .get(`/fees/student/${childId}`)
      .then((r) => setData(r.data))
      .catch(() => {});
  }, [childId]);

  const activeChild = useMemo(() => children.find((c) => c._id === childId), [children, childId]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Child&apos;s fees</h1>
          <p>What has been paid and what is pending.</p>
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

      {!activeChild ? (
        <div className="card">
          <div className="empty">
            <p>No children linked to this account.</p>
          </div>
        </div>
      ) : (
        <FeeRecords records={data.records} summary={data.summary} />
      )}
    </>
  );
}
