import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { CalendarDays, Plus, Pencil, Trash2, PartyPopper, Palmtree } from 'lucide-react';

const TYPE_ICON = { Academic: CalendarDays, Cultural: PartyPopper, Sports: PartyPopper, Holiday: Palmtree, Meeting: CalendarDays, Exam: CalendarDays, Other: CalendarDays };

export default function Events() {
  const [list, setList] = useState([]);
  const [types, setTypes] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () => {
    const params = {};
    if (typeFilter) params.type = typeFilter;
    return api.get('/events', { params }).then((r) => {
      setList(r.data.list);
      setTypes(r.data.types);
    });
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const openNew = () => {
    setForm({ title: '', description: '', date: '', startTime: '', endTime: '', venue: '', type: 'Academic', audience: 'all', isHoliday: false });
    setModal(true);
  };

  const openEdit = (e) => {
    setForm({ ...e });
    setModal(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (form._id) await api.put(`/events/${form._id}`, form);
      else await api.post('/events', form);
      setModal(false);
      showToast('Event saved');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save event');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e) => {
    if (!confirm(`Delete "${e.title}"?`)) return;
    try {
      await api.delete(`/events/${e._id}`);
      showToast('Event deleted');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete');
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = list.filter((e) => e.date >= today).length;
  const holidays = list.filter((e) => e.isHoliday).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Events & Calendar</h1>
          <p>School events, functions and holidays.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> Add event
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={CalendarDays} tone="indigo" value={list.length} label="Events on record" sub="All types" />
        <StatCard icon={PartyPopper} tone="green" value={upcoming} label="Upcoming" sub="From today onwards" />
        <StatCard icon={Palmtree} tone="amber" value={holidays} label="Holidays" sub="Marked in calendar" />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <select className="select" style={{ width: 180 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {types.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid-2">
        {list.map((e) => {
          const Icon = TYPE_ICON[e.type] || CalendarDays;
          const past = e.date < today;
          return (
            <div className="card" key={e._id} style={{ opacity: past ? 0.72 : 1 }}>
              <div className="card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className={`stat-icon ${e.isHoliday ? 'amber' : e.type === 'Cultural' || e.type === 'Sports' ? 'green' : 'indigo'}`}>
                    <Icon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>
                      {e.title}
                      {e.isHoliday && <span className="badge amber" style={{ marginLeft: 8 }}>Holiday</span>}
                      {past && <span className="badge gray" style={{ marginLeft: 8 }}>Past</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                      {fmtDate(e.date)} {e.startTime && `· ${e.startTime}${e.endTime ? `–${e.endTime}` : ''}`} {e.venue && `· ${e.venue}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}><Pencil size={13} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => remove(e)}><Trash2 size={13} /></button>
                  </div>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: 0 }}>
                  <span className={`badge ${e.isHoliday ? 'amber' : 'indigo'}`} style={{ marginRight: 8 }}>{e.type}</span>
                  {e.description}
                </p>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="card"><div className="empty"><p>No events yet.</p></div></div>
        )}
      </div>

      {modal && (
        <Modal
          title={form._id ? 'Edit event' : 'Add event'}
          onClose={() => setModal(false)}
          width={540}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                Save event
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <div className="rows-gap">
            <div className="field"><label>Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="field"><label>Description</label><textarea className="input" rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid-3">
              <div className="field"><label>Date</label><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="field"><label>Start</label><input className="input" type="time" value={form.startTime || ''} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
              <div className="field"><label>End</label><input className="input" type="time" value={form.endTime || ''} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
            </div>
            <div className="grid-3">
              <div className="field">
                <label>Type</label>
                <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {['Academic', 'Cultural', 'Sports', 'Holiday', 'Meeting', 'Exam', 'Other'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Audience</label>
                <select className="select" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                  {['all', 'students', 'teachers', 'parents'].map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="field"><label>Venue</label><input className="input" value={form.venue || ''} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" checked={!!form.isHoliday} onChange={(e) => setForm({ ...form, isHoliday: e.target.checked })} />
              School holiday
            </label>
          </div>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}