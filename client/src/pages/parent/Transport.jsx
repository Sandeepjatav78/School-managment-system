import { useEffect, useState } from 'react';
import api from '../../api.js';
import ChildSelect from '../../components/ChildSelect.jsx';
import StatCard from '../../components/StatCard.jsx';
import { formatINR } from '../../components/format.js';
import { Bus, MapPin, Clock, UserRound, Phone } from 'lucide-react';

export default function ParentTransport() {
  const [studentId, setStudentId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!studentId) return;
    setData(null);
    setError('');
    api
      .get(`/transport/child/${studentId}`)
      .then((r) => setData(r.data))
      .catch((e) => {
        if (e.response?.status === 404) setData(null);
        else setError(e.response?.data?.message || 'Failed to load');
      });
  }, [studentId]);

  if (!studentId) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1>Transport</h1>
            <p>Your child's bus route and stop details.</p>
          </div>
          <ChildSelect onChange={setStudentId} />
        </div>
        <div className="card"><div className="empty"><p>No children linked to this account.</p></div></div>
      </>
    );
  }

  const route = data?.route;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Transport</h1>
          <p>Your child's bus route and stop details.</p>
        </div>
        <ChildSelect onChange={setStudentId} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!data && !error && (
        <div className="card">
          <div className="empty">
            <Bus size={32} />
            <p>Your child is not assigned to any transport route.</p>
            <p style={{ fontSize: 12 }}>Contact the school office to enrol your child in the bus service.</p>
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="grid-stats">
            <StatCard icon={Bus} tone="indigo" value={route?.name || '—'} label="Route" sub={route?.vehicle?.registrationNo || '—'} />
            <StatCard icon={MapPin} tone="green" value={data.stop || '—'} label="Child's stop" sub={`Pickup ${data.pickupTime || '—'}`} />
            <StatCard icon={Clock} tone="amber" value={data.pickupTime || '—'} label="Pickup time" sub={`Drop at ${data.dropTime || '—'}`} />
            <StatCard icon={UserRound} tone="sky" value={route?.driverName || '—'} label="Driver" sub={route?.driverPhone || '—'} />
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-pad">
                <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Route stops</h2>
                <div className="rows-gap">
                  {route?.stops.map((s, i) => (
                    <div key={s._id} className="list-card" style={{ padding: '9px 4px' }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 99,
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 10.5,
                          fontWeight: 700,
                          background: s.name === data.stop ? 'var(--primary)' : 'var(--border-strong)',
                          color: s.name === data.stop ? '#fff' : 'var(--text-soft)',
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </div>
                      <div className="grow">
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {s.name}
                          {s.name === data.stop && <span className="badge indigo" style={{ marginLeft: 8 }}>Child's stop</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{s.time || '—'}</div>
                      </div>
                      <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{s.fare ? formatINR(s.fare) : '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-pad">
                <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Vehicle & contact</h2>
                <div className="kv"><span className="k">Vehicle</span><span className="v">{route?.vehicle?.registrationNo || '—'} ({route?.vehicle?.type || '—'})</span></div>
                <div className="kv"><span className="k">Capacity</span><span className="v">{route?.vehicle?.capacity || '—'} seats</span></div>
                <div className="kv"><span className="k">Driver</span><span className="v">{route?.driverName || '—'}</span></div>
                <div className="kv"><span className="k">Driver phone</span><span className="v"><Phone size={12} style={{ verticalAlign: -2 }} /> {route?.driverPhone || '—'}</span></div>
                <div className="kv"><span className="k">Monthly fare</span><span className="v" style={{ color: 'var(--primary)' }}>{formatINR(data.amount)}</span></div>
                <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 14 }}>
                  The school sends a monthly transport fee of {formatINR(data.amount)} for this route. Please ensure the child reaches the stop 5 minutes early.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}