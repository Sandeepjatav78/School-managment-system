import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { formatINR } from '../../components/format.js';
import { Bus, Route as RouteIcon, MapPin, Plus, Pencil, Trash2, UserRound } from 'lucide-react';

export default function Transport() {
  const [tab, setTab] = useState('routes');
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [stopForm, setStopForm] = useState('');
  const [assignForm, setAssignForm] = useState({ studentId: '', routeId: '', stop: '', amount: 0, pickupTime: '', dropTime: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () =>
    Promise.all([
      api.get('/transport/vehicles').then((r) => setVehicles(r.data)),
      api.get('/transport/routes').then((r) => setRoutes(r.data)),
      api.get('/transport/assignments').then((r) => setAssignments(r.data)),
    ]);

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
    api.get('/students').then((r) => setStudents(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = (kind) => {
    setModal(kind);
    if (kind === 'vehicle') setForm({ registrationNo: '', type: 'Bus', capacity: 40, driverName: '', driverPhone: '', insuranceExpiry: '', status: 'Active' });
    if (kind === 'route') setForm({ name: '', vehicle: '', driverName: '', driverPhone: '', status: 'Active', stops: [{ name: '', time: '', fare: 0 }] });
  };

  const openEdit = (kind, doc) => {
    setModal(kind);
    setForm({ ...doc, vehicle: doc.vehicle?._id || '' });
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const base = modal === 'vehicle' ? '/transport/vehicles' : '/transport/routes';
      if (form._id) await api.put(`${base}/${form._id}`, form);
      else await api.post(base, form);
      setModal(null);
      showToast('Saved');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (kind, doc) => {
    if (!confirm('Delete this record?')) return;
    try {
      const base = kind === 'vehicle' ? '/transport/vehicles' : '/transport/routes';
      await api.delete(`${base}/${doc._id}`);
      showToast('Deleted');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete');
    }
  };

  const saveAssign = async () => {
    setSaving(true);
    setError('');
    try {
      const r = await api.post('/transport/assignments', assignForm);
      showToast(`${r.data.student?.name || 'Student'} assigned to route`);
      setModal(null);
      setAssignForm({ studentId: '', routeId: '', stop: '', amount: 0, pickupTime: '', dropTime: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not assign');
    } finally {
      setSaving(false);
    }
  };

  const removeAssign = async (a) => {
    try {
      await api.delete(`/transport/assignments/${a._id}`);
      showToast('Assignment removed');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove');
    }
  };

  const setStop = (i, field, value) => {
    const stops = [...form.stops];
    stops[i] = { ...stops[i], [field]: value };
    setForm({ ...form, stops });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Transport</h1>
          <p>Vehicles, routes, stops and student assignments.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setModal('assign')}>
            <UserRound size={15} /> Assign student
          </button>
          <button className="btn btn-primary" onClick={() => openNew('route')}>
            <Plus size={15} /> New route
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={Bus} tone="indigo" value={vehicles.length} label="Vehicles" sub={`${vehicles.filter((v) => v.status === 'Active').length} active`} />
        <StatCard icon={RouteIcon} tone="green" value={routes.length} label="Routes" sub={`${routes.reduce((s, r) => s + r.stops.length, 0)} total stops`} />
        <StatCard icon={MapPin} tone="amber" value={assignments.length} label="Students assigned" sub={`${formatINR(assignments.reduce((s, a) => s + (a.amount || 0), 0))} monthly fare`} />
      </div>

      <div className="tabs">
        <button className={tab === 'routes' ? 'on' : ''} onClick={() => setTab('routes')}><RouteIcon size={14} /> Routes ({routes.length})</button>
        <button className={tab === 'vehicles' ? 'on' : ''} onClick={() => setTab('vehicles')}><Bus size={14} /> Vehicles ({vehicles.length})</button>
        <button className={tab === 'assignments' ? 'on' : ''} onClick={() => setTab('assignments')}><UserRound size={14} /> Assignments ({assignments.length})</button>
      </div>

      {tab === 'routes' && (
        <div className="grid-2">
          {routes.map((r) => (
            <div className="card" key={r._id}>
              <div className="card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className="stat-icon indigo"><RouteIcon /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                      {r.vehicle ? `${r.vehicle.registrationNo} · ${r.vehicle.type}` : 'No vehicle'} · {r.driverName || 'No driver'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit('route', r)}><Pencil size={13} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => remove('route', r)}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 12.5 }}>
                  {r.stops.map((s) => (
                    <div key={s._id} className="kv" style={{ padding: '6px 0' }}>
                      <span className="k"><MapPin size={12} style={{ verticalAlign: -2, marginRight: 4 }} />{s.name}</span>
                      <span className="v" style={{ fontSize: 12 }}>{s.time} · {formatINR(s.fare)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {routes.length === 0 && (
            <div className="card"><div className="empty"><p>No routes yet.</p></div></div>
          )}
        </div>
      )}

      {tab === 'vehicles' && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Driver</th>
                  <th>Insurance expiry</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id}>
                    <td style={{ fontWeight: 600 }} className="mono">{v.registrationNo}</td>
                    <td><span className="badge indigo">{v.type}</span></td>
                    <td>{v.capacity}</td>
                    <td>
                      <div>{v.driverName || '—'}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{v.driverPhone}</div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{v.insuranceExpiry || '—'}</td>
                    <td><span className={`badge ${v.status === 'Active' ? 'green' : v.status === 'Under Maintenance' ? 'amber' : 'gray'}`}>{v.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit('vehicle', v)}><Pencil size={13} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => remove('vehicle', v)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr><td colSpan={7}><div className="empty"><p>No vehicles. Add one first.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: 14 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openNew('vehicle')}><Plus size={13} /> Add vehicle</button>
          </div>
        </div>
      )}

      {tab === 'assignments' && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Route</th>
                  <th>Stop</th>
                  <th>Pickup / Drop</th>
                  <th>Monthly fare</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="cell-main">
                        <div className="avatar sm">{a.student?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                        {a.student?.name || '—'}
                      </div>
                    </td>
                    <td><span className="badge indigo">{a.route?.name || '—'}</span></td>
                    <td>{a.stop}</td>
                    <td style={{ fontSize: 12.5 }}>{a.pickupTime || '—'} / {a.dropTime || '—'}</td>
                    <td className="mono">{formatINR(a.amount)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => removeAssign(a)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr><td colSpan={6}><div className="empty"><p>No assignments yet.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal === 'vehicle' && (
        <Modal
          title={form._id ? 'Edit vehicle' : 'Add vehicle'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                Save
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <div className="rows-gap">
            <div className="grid-2">
              <div className="field"><label>Registration no.</label><input className="input" value={form.registrationNo} onChange={(e) => setForm({ ...form, registrationNo: e.target.value })} /></div>
              <div className="field">
                <label>Type</label>
                <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {['Bus', 'Van', 'Auto', 'Car', 'Other'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="field"><label>Capacity</label><input className="input" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
              <div className="field"><label>Insurance expiry</label><input className="input" type="date" value={form.insuranceExpiry || ''} onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })} /></div>
            </div>
            <div className="grid-2">
              <div className="field"><label>Driver name</label><input className="input" value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} /></div>
              <div className="field"><label>Driver phone</label><input className="input" value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} /></div>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'route' && (
        <Modal
          title={form._id ? 'Edit route' : 'New route'}
          onClose={() => setModal(null)}
          width={560}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                Save route
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <div className="rows-gap">
            <div className="grid-2">
              <div className="field"><label>Route name</label><input className="input" value={form.name} placeholder="e.g. Route 1 — Model Town" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="field">
                <label>Vehicle</label>
                <select className="select" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
                  <option value="">No vehicle</option>
                  {vehicles.map((v) => <option key={v._id} value={v._id}>{v.registrationNo} ({v.type})</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--text-soft)' }}>Stops</label>
              {form.stops.map((s, i) => (
                <div key={i} className="grid-3" style={{ marginBottom: 8 }}>
                  <input className="input" placeholder="Stop name" value={s.name} onChange={(e) => setStop(i, 'name', e.target.value)} />
                  <input className="input" type="time" value={s.time || ''} onChange={(e) => setStop(i, 'time', e.target.value)} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className="input" type="number" min={0} placeholder="Fare ₹" value={s.fare} onChange={(e) => setStop(i, 'fare', e.target.value)} />
                    {form.stops.length > 1 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, stops: form.stops.filter((_, j) => j !== i) })}>✕</button>
                    )}
                  </div>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, stops: [...form.stops, { name: '', time: '', fare: 0 }] })}>+ Add stop</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'assign' && (
        <Modal
          title="Assign student to route"
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAssign} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                Assign
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <div className="rows-gap">
            <div className="field">
              <label>Student</label>
              <select className="select" value={assignForm.studentId} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}>
                <option value="">Select student</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.user?.name} — {s.class?.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Route</label>
              <select className="select" value={assignForm.routeId} onChange={(e) => setAssignForm({ ...assignForm, routeId: e.target.value, stop: '' })}>
                <option value="">Select route</option>
                {routes.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Stop</label>
              <select className="select" value={assignForm.stop} onChange={(e) => setAssignForm({ ...assignForm, stop: e.target.value })}>
                <option value="">Select stop</option>
                {(routes.find((r) => r._id === assignForm.routeId)?.stops || []).map((s) => (
                  <option key={s._id} value={s.name}>{s.name} {s.time ? `· ${s.time}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="grid-2">
              <div className="field"><label>Pickup time</label><input className="input" type="time" value={assignForm.pickupTime} onChange={(e) => setAssignForm({ ...assignForm, pickupTime: e.target.value })} /></div>
              <div className="field"><label>Drop time</label><input className="input" type="time" value={assignForm.dropTime} onChange={(e) => setAssignForm({ ...assignForm, dropTime: e.target.value })} /></div>
            </div>
            <div className="field"><label>Monthly fare (₹)</label><input className="input" type="number" min={0} value={assignForm.amount} onChange={(e) => setAssignForm({ ...assignForm, amount: e.target.value })} /></div>
          </div>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}