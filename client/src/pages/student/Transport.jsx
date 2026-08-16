import { useEffect, useState } from 'react';
import api from '../../api.js';
import StatCard from '../../components/StatCard.jsx';
import { formatINR } from '../../components/format.js';
import { Bus, MapPin, Clock, UserRound, Phone } from 'lucide-react';

export default function Transport() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/transport/mine')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;

  if (!data) {
    return (
      <div className="card">
        <div className="empty">
          <Bus size={32} />
          <p>You are not assigned to any transport route.</p>
          <p style={{ fontSize: 12 }}>If you need the school bus, please contact the school office.</p>
        </div>
      </div>
    );
  }

  const route = data.route;
  const myStop = route?.stops?.find((s) => s.name === data.stop);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My Transport</h1>
          <p>Your bus route and stop details.</p>
        </div>
      </div>

      <div className="grid-stats">
        <StatCard icon={Bus} tone="indigo" value={route?.name || '—'} label="Route" sub={route?.vehicle?.registrationNo || '—'} />
        <StatCard icon={MapPin} tone="green" value={data.stop || '—'} label="Your stop" sub={myStop?.time ? `Pickup ${myStop.time}` : ''} />
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
                      {s.name === data.stop && <span className="badge indigo" style={{ marginLeft: 8 }}>Your stop</span>}
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
              Please reach your stop 5 minutes before the pickup time. Carry your transport ID card while travelling.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}