import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { CalendarPlus, CalendarClock, CheckCircle2 } from 'lucide-react';

const TYPE_COLOR = { Casual: 'sky', Sick: 'red', Earned: 'green', Medical: 'amber', Emergency: 'red', Other: 'gray' };

export default function Leaves() {
  const [data, setData] = useState({ list: [], pending: [], summary: {} });
  const [balance, setBalance] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '', type: 'Casual' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () =>
    Promise.all([
      api.get('/leaves').then((r) => setData(r.data)),
      api.get('/leaves/balance').then((r) => setBalance(r.data)).catch(() => {}),
    ]);

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const apply = async () => {
    setSaving(true);
    setError('');
    try {
      const r = await api.post('/leaves', form);
      showToast(`Leave applied — ${r.data.days} day(s)`);
      setModal(false);
      setForm({ startDate: '', endDate: '', reason: '', type: 'Casual' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not apply');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My Leaves</h1>
          <p>Apply for leave and track the principal's approval.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <CalendarPlus size={15} /> Apply for leave
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="grid-stats">
          <StatCard icon={CalendarClock} tone="indigo" value={balance.length ? balance.reduce((s, b) => s + b.total, 0) : '—'} label="Total leave quota" sub="All types per year" />
          <StatCard icon={CalendarPlus} tone="amber" value={balance.reduce((s, b) => s + b.used, 0)} label="Days used" sub="Approved + pending" />
          <StatCard icon={CheckCircle2} tone="green" value={data.list.filter((l) => l.status === 'Approved').length} label="Approved leaves" sub="All time" />
        </div>
        <div className="card">
          <div className="card-pad">
            <h2 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Leave balance</h2>
            {balance.map((b) => (
              <div className="kv" key={b.type}>
                <span className="k">{b.type}</span>
                <span className="v">
                  {b.used}/{b.total} used
                  <span className="badge" style={{ marginLeft: 8, background: b.remaining > 0 ? 'var(--green-soft)' : 'var(--red-soft)', color: b.remaining > 0 ? 'var(--green)' : 'var(--red)' }}>
                    {b.remaining} left
                  </span>
                </span>
              </div>
            ))}
            {balance.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Loading balance…</p>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {data.list.map((l) => (
                <tr key={l._id}>
                  <td><span className={`badge ${TYPE_COLOR[l.type] || 'gray'}`}>{l.type}</span></td>
                  <td style={{ fontSize: 12.5 }}>{fmtDate(l.startDate)} → {fmtDate(l.endDate)}</td>
                  <td>{l.days}</td>
                  <td style={{ fontSize: 12.5, maxWidth: 240 }}>{l.reason}</td>
                  <td>
                    <span className={`badge ${l.status === 'Approved' ? 'green' : l.status === 'Rejected' ? 'red' : 'amber'}`}>{l.status}</span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{fmtDate(l.appliedOn)}</td>
                  <td style={{ fontSize: 12.5 }}>{l.remarks || '—'}</td>
                </tr>
              ))}
              {data.list.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty"><p>No leave applied yet.</p></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal
          title="Apply for leave"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={apply} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                Apply
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <div className="rows-gap">
            <div className="grid-2">
              <div className="field"><label>Start date</label><input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="field"><label>End date</label><input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div className="field">
              <label>Type</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {['Casual', 'Sick', 'Earned', 'Medical', 'Emergency', 'Other'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field"><label>Reason</label><textarea className="input" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          </div>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}