import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { formatINR, monthLabel } from '../../components/FeeRecords.jsx';
import { Wallet, AlertCircle, CheckCircle2, Settings2, RefreshCw, Check } from 'lucide-react';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Fees() {
  const [month, setMonth] = useState(currentMonth());
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [monthSummary, setMonthSummary] = useState(null);
  const [totalPending, setTotalPending] = useState({ count: 0, amount: 0 });
  const [structures, setStructures] = useState([]);
  const [structureModal, setStructureModal] = useState(false);
  const [structureForm, setStructureForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () => {
    const params = { month };
    if (classFilter) params.classId = classFilter;
    if (statusFilter) params.status = statusFilter;
    return api
      .get('/fees', { params })
      .then((r) => {
        setRecords(r.data.records);
        setMonthSummary(r.data.monthSummary);
        setTotalPending(r.data.totalPending);
      });
  };

  const loadStructures = () =>
    api.get('/fees/structures').then((r) => {
      setStructures(r.data);
      const form = {};
      for (const s of r.data) form[s.class._id] = s.monthlyFee;
      setStructureForm(form);
    });

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load fees'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, classFilter, statusFilter]);

  useEffect(() => {
    Promise.all([api.get('/classes'), loadStructures()])
      .then(([c]) => setClasses(c.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/fees/generate', { month });
      showToast(`Fees generated for ${monthLabel(month)}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate fees');
    } finally {
      setSaving(false);
    }
  };

  const saveStructures = async () => {
    setSaving(true);
    setError('');
    try {
      const items = classes.map((c) => ({ classId: c._id, monthlyFee: Number(structureForm[c._id]) || 0 }));
      await api.post('/fees/structures/bulk', { items });
      setStructureModal(false);
      showToast('Fee structure saved — current month generated');
      await Promise.all([load(), loadStructures()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save fee structure');
    } finally {
      setSaving(false);
    }
  };

  const setPaid = async (fee) => {
    try {
      await api.post(`/fees/${fee._id}/pay`);
      showToast(`${fee.student?.name} marked paid`);
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update');
    }
  };

  const setPending = async (fee) => {
    try {
      await api.post(`/fees/${fee._id}/unpay`);
      showToast('Marked as pending');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Fees</h1>
          <p>Monthly fees, who has paid and who hasn&apos;t.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setStructureModal(true)}>
          <Settings2 /> Fee structure
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard
          icon={Wallet}
          tone="indigo"
          value={monthSummary ? formatINR(monthSummary.pendingAmount) : '—'}
          label={`Pending · ${monthLabel(month)}`}
          sub={monthSummary ? `${monthSummary.pendingCount} unpaid records` : ''}
        />
        <StatCard
          icon={CheckCircle2}
          tone="green"
          value={monthSummary ? formatINR(monthSummary.paidAmount) : '—'}
          label={`Collected · ${monthLabel(month)}`}
          sub={monthSummary ? `${monthSummary.paidCount} paid records` : ''}
        />
        <StatCard
          icon={AlertCircle}
          tone="red"
          value={formatINR(totalPending.amount)}
          label="Pending overall"
          sub={`${totalPending.count} unpaid records across all months`}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="field" style={{ margin: 0 }}>
          <label>Month</label>
          <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <button className="btn btn-ghost" onClick={generate} disabled={saving}>
          <RefreshCw size={14} /> Generate fees
        </button>
        <div style={{ flex: 1 }} />
        <select className="select" style={{ width: 180 }} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="select" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Paid on</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div className="cell-main">
                      <div className="avatar sm">{r.student?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                      {r.student?.name || '—'}
                    </div>
                  </td>
                  <td>
                    <span className="badge indigo">{r.class?.name || '—'}</span>
                  </td>
                  <td>{monthLabel(r.month)}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{formatINR(r.amount)}</td>
                  <td>
                    {r.paidDate
                      ? new Date(r.paidDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                      : '—'}
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'Paid' ? 'green' : 'red'}`}>{r.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {r.status === 'Pending' ? (
                        <button className="btn btn-primary btn-sm" onClick={() => setPaid(r)}>
                          <Check size={13} /> Mark paid
                        </button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => setPending(r)}>
                          Undo
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <p>No fee records for this month. Click “Generate fees” to create them.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {structureModal && (
        <Modal
          title="Monthly fee per class"
          onClose={() => setStructureModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setStructureModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveStructures} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                Save structure
              </button>
            </>
          }
        >
          <p style={{ fontSize: 12.5, color: 'var(--text-soft)', marginBottom: 16 }}>
            Set the monthly fee per class. Saving generates fee records for the current month automatically.
          </p>
          {error && <div className="error-banner">{error}</div>}
          {classes.map((c) => (
            <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1, fontWeight: 600 }}>{c.name}</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: 8, fontSize: 13, color: 'var(--text-faint)', fontWeight: 600 }}>₹</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  style={{ paddingLeft: 26, width: 140 }}
                  value={structureForm[c._id] ?? ''}
                  placeholder="0"
                  onChange={(e) => setStructureForm({ ...structureForm, [c._id]: e.target.value })}
                />
              </div>
            </div>
          ))}
          {classes.length === 0 && <div className="empty"><p>Create classes first.</p></div>}
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
