import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate, formatINR } from '../../components/format.js';
import { BedDouble, Building2, DoorOpen, Plus, Pencil, Trash2, UserRound, LogOut } from 'lucide-react';

export default function Hostel() {
  const [tab, setTab] = useState('hostels');
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allotments, setAllotments] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [allotForm, setAllotForm] = useState({ studentId: '', hostelId: '', roomId: '', bedNo: '', fee: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () =>
    Promise.all([
      api.get('/hostel/hostels').then((r) => setHostels(r.data)),
      api.get('/hostel/rooms').then((r) => setRooms(r.data)),
      api.get('/hostel/allotments').then((r) => setAllotments(r.data)),
    ]);

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
    api.get('/students').then((r) => setStudents(r.data)).catch(() => {});
    api.get('/teachers').then((r) => setTeachers(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = (kind) => {
    setModal(kind);
    if (kind === 'hostel') setForm({ name: '', warden: '', contact: '', address: '', capacity: 0 });
    if (kind === 'room') setForm({ hostel: '', roomNo: '', floor: 'Ground', type: 'Shared', capacity: 4 });
  };

  const openEdit = (kind, doc) => {
    setModal(kind);
    setForm({ ...doc, warden: doc.warden?._id || '', hostel: doc.hostel?._id || '' });
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const base = modal === 'hostel' ? '/hostel/hostels' : '/hostel/rooms';
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
      const base = kind === 'hostel' ? '/hostel/hostels' : '/hostel/rooms';
      await api.delete(`${base}/${doc._id}`);
      showToast('Deleted');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete');
    }
  };

  const saveAllot = async () => {
    setSaving(true);
    setError('');
    try {
      const r = await api.post('/hostel/allotments', allotForm);
      showToast(`${r.data.student?.name || 'Student'} allotted a bed`);
      setModal(null);
      setAllotForm({ studentId: '', hostelId: '', roomId: '', bedNo: '', fee: 0 });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not allot');
    } finally {
      setSaving(false);
    }
  };

  const vacate = async (a) => {
    if (!confirm('Vacate this bed?')) return;
    try {
      await api.post(`/hostel/allotments/${a._id}/vacate`);
      showToast('Bed vacated');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not vacate');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Hostel</h1>
          <p>Hostels, rooms and bed allotments for boarders.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setModal('allot')}>
            <UserRound size={15} /> Allot bed
          </button>
          <button className="btn btn-primary" onClick={() => openNew('hostel')}>
            <Plus size={15} /> New hostel
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={Building2} tone="indigo" value={hostels.length} label="Hostels" sub={hostels.map((h) => h.name).join(', ') || '—'} />
        <StatCard icon={DoorOpen} tone="green" value={rooms.reduce((s, r) => s + r.capacity, 0)} label="Total beds" sub={`${rooms.length} rooms`} />
        <StatCard icon={BedDouble} tone="amber" value={allotments.filter((a) => a.status === 'Active').length} label="Occupied beds" sub={`${formatINR(allotments.filter((a) => a.status === 'Active').reduce((s, a) => s + (a.fee || 0), 0))}/month`} />
      </div>

      <div className="tabs">
        <button className={tab === 'hostels' ? 'on' : ''} onClick={() => setTab('hostels')}><Building2 size={14} /> Hostels ({hostels.length})</button>
        <button className={tab === 'rooms' ? 'on' : ''} onClick={() => setTab('rooms')}><DoorOpen size={14} /> Rooms ({rooms.length})</button>
        <button className={tab === 'allotments' ? 'on' : ''} onClick={() => setTab('allotments')}><BedDouble size={14} /> Allotments ({allotments.length})</button>
      </div>

      {tab === 'hostels' && (
        <div className="grid-2">
          {hostels.map((h) => (
            <div className="card" key={h._id}>
              <div className="card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className="stat-icon indigo"><Building2 /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Warden: {h.warden?.user?.name || '—'} · {h.contact || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit('hostel', h)}><Pencil size={13} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => remove('hostel', h)}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="kv"><span className="k">Address</span><span className="v">{h.address || '—'}</span></div>
                <div className="kv"><span className="k">Capacity</span><span className="v">{h.totalCapacity} beds</span></div>
              </div>
            </div>
          ))}
          {hostels.length === 0 && (
            <div className="card"><div className="empty"><p>No hostels yet.</p></div></div>
          )}
        </div>
      )}

      {tab === 'rooms' && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Hostel</th>
                  <th>Floor</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Occupancy</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600 }}>{r.roomNo}</td>
                    <td><span className="badge indigo">{r.hostel?.name}</span></td>
                    <td>{r.floor}</td>
                    <td>{r.type}</td>
                    <td>{r.capacity}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#eef0f6', borderRadius: 99, maxWidth: 120, overflow: 'hidden' }}>
                          <div
                            style={{ height: '100%', width: `${Math.min(100, (r.occupied / Math.max(1, r.capacity)) * 100)}%`, background: r.occupied >= r.capacity ? 'var(--red)' : 'var(--green)', borderRadius: 99 }}
                          />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{r.occupied}/{r.capacity}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit('room', r)}><Pencil size={13} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => remove('room', r)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr><td colSpan={7}><div className="empty"><p>No rooms. Create a hostel and add rooms.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: 14 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openNew('room')}><Plus size={13} /> Add room</button>
          </div>
        </div>
      )}

      {tab === 'allotments' && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Hostel</th>
                  <th>Room / Bed</th>
                  <th>Since</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allotments.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="cell-main">
                        <div className="avatar sm">{a.student?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                        {a.student?.name || '—'}
                      </div>
                    </td>
                    <td><span className="badge indigo">{a.hostel?.name}</span></td>
                    <td className="mono">{a.room?.roomNo} {a.bedNo ? `· ${a.bedNo}` : ''}</td>
                    <td style={{ fontSize: 12.5 }}>{a.startDate || '—'}</td>
                    <td className="mono">{formatINR(a.fee)}</td>
                    <td><span className={`badge ${a.status === 'Active' ? 'green' : 'gray'}`}>{a.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {a.status === 'Active' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => vacate(a)}><LogOut size={13} /> Vacate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {allotments.length === 0 && (
                  <tr><td colSpan={7}><div className="empty"><p>No allotments yet.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal === 'hostel' && (
        <Modal
          title={form._id ? 'Edit hostel' : 'New hostel'}
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
            <div className="field"><label>Hostel name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field">
              <label>Warden</label>
              <select className="select" value={form.warden} onChange={(e) => setForm({ ...form, warden: e.target.value })}>
                <option value="">No warden</option>
                {teachers.map((t) => <option key={t._id} value={t._id}>{t.user?.name} ({t.employeeId})</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="field"><label>Contact</label><input className="input" value={form.contact || ''} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
              <div className="field"><label>Address</label><input className="input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'room' && (
        <Modal
          title={form._id ? 'Edit room' : 'Add room'}
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
            <div className="field">
              <label>Hostel</label>
              <select className="select" value={form.hostel} onChange={(e) => setForm({ ...form, hostel: e.target.value })}>
                <option value="">Select hostel</option>
                {hostels.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="field"><label>Room no.</label><input className="input" value={form.roomNo} onChange={(e) => setForm({ ...form, roomNo: e.target.value })} /></div>
              <div className="field"><label>Floor</label><input className="input" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} /></div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Type</label>
                <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {['Dormitory', 'Shared', 'Private'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field"><label>Capacity</label><input className="input" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'allot' && (
        <Modal
          title="Allot a bed"
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAllot} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                Allot
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <div className="rows-gap">
            <div className="field">
              <label>Student</label>
              <select className="select" value={allotForm.studentId} onChange={(e) => setAllotForm({ ...allotForm, studentId: e.target.value })}>
                <option value="">Select student</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.user?.name} — {s.class?.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Hostel</label>
              <select className="select" value={allotForm.hostelId} onChange={(e) => setAllotForm({ ...allotForm, hostelId: e.target.value })}>
                <option value="">Select hostel</option>
                {hostels.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Room</label>
              <select className="select" value={allotForm.roomId} onChange={(e) => setAllotForm({ ...allotForm, roomId: e.target.value })}>
                <option value="">Select room</option>
                {rooms.filter((r) => !allotForm.hostelId || r.hostel?._id === allotForm.hostelId).map((r) => (
                  <option key={r._id} value={r._id}>{r.roomNo} ({r.occupied}/{r.capacity} occupied)</option>
                ))}
              </select>
            </div>
            <div className="grid-2">
              <div className="field"><label>Bed no.</label><input className="input" value={allotForm.bedNo} placeholder="e.g. B-101-1" onChange={(e) => setAllotForm({ ...allotForm, bedNo: e.target.value })} /></div>
              <div className="field"><label>Monthly fee (₹)</label><input className="input" type="number" min={0} value={allotForm.fee} onChange={(e) => setAllotForm({ ...allotForm, fee: e.target.value })} /></div>
            </div>
          </div>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}