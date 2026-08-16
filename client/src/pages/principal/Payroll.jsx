import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate, formatINR, monthLabel } from '../../components/format.js';
import { Banknote, Wallet, Settings2, RefreshCw, Check, BadgeCheck } from 'lucide-react';

export default function Payroll() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [list, setList] = useState([]);
  const [months, setMonths] = useState([]);
  const [summary, setSummary] = useState({ gross: 0, net: 0, count: 0 });
  const [structures, setStructures] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [structureForm, setStructureForm] = useState({});
  const [structureModal, setStructureModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () =>
    api.get('/payroll', { params: { month } }).then((r) => {
      setList(r.data.list);
      setMonths(r.data.months);
      setSummary(r.data.summary);
    });

  const loadStructures = () =>
    api.get('/payroll/structures').then((r) => {
      setStructures(r.data.structures);
      setTeachers(r.data.teachers);
      const form = {};
      for (const s of r.data.structures) {
        form[s.teacher._id] = { basic: s.basic, hra: s.hra, da: s.da, allowances: s.allowances, deductions: s.deductions };
      }
      for (const t of r.data.teachers) {
        if (!form[t._id]) form[t._id] = { basic: '', hra: '', da: '', allowances: [], deductions: [] };
      }
      setStructureForm(form);
    });

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    loadStructures().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    setSaving(true);
    setError('');
    try {
      const r = await api.post('/payroll/generate', { month });
      showToast(r.data.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (p) => {
    try {
      await api.post(`/payroll/${p._id}/pay`);
      showToast('Payslip marked paid');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update');
    }
  };

  const saveStructures = async () => {
    setSaving(true);
    setError('');
    try {
      const items = teachers.map((t) => ({
        teacherId: t._id,
        basic: Number(structureForm[t._id]?.basic) || 0,
        hra: Number(structureForm[t._id]?.hra) || 0,
        da: Number(structureForm[t._id]?.da) || 0,
        allowances: structureForm[t._id]?.allowances || [],
        deductions: structureForm[t._id]?.deductions || [],
      }));
      await api.post('/payroll/structures/bulk', { items });
      setStructureModal(false);
      showToast('Salary structures saved');
      await loadStructures();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save structures');
    } finally {
      setSaving(false);
    }
  };

  const setAllowance = (tId, kind, i, field, value) => {
    const st = { ...structureForm[tId] };
    const arr = [...(st[kind] || [])];
    arr[i] = { ...arr[i], [field]: value };
    st[kind] = arr;
    setStructureForm({ ...structureForm, [tId]: st });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Payroll</h1>
          <p>Salary structures and monthly payslips for staff.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setStructureModal(true)}>
            <Settings2 size={15} /> Salary structures
          </button>
          <button className="btn btn-primary" onClick={generate} disabled={saving}>
            <RefreshCw size={15} /> Generate {monthLabel(month)}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={Banknote} tone="indigo" value={summary.count} label="Payslips" sub={monthLabel(month)} />
        <StatCard icon={Wallet} tone="green" value={formatINR(summary.net)} label="Net payable" sub={`Gross ${formatINR(summary.gross)}`} />
        <StatCard icon={BadgeCheck} tone="sky" value={list.filter((p) => p.status === 'Paid').length} label="Paid" sub={`${list.filter((p) => p.status !== 'Paid').length} pending`} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ margin: 0 }}>
          <label>Month</label>
          <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Month</th>
                <th>Earnings</th>
                <th>Deductions</th>
                <th>Net</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="cell-main">
                      <div className="avatar sm">{p.teacher?.user?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                      {p.teacher?.user?.name || '—'}
                    </div>
                  </td>
                  <td>{monthLabel(p.month)}</td>
                  <td>
                    <div className="mono" style={{ fontWeight: 600 }}>{formatINR(p.gross)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                      Basic {formatINR(p.basic)} · HRA {formatINR(p.hra)} · DA {formatINR(p.da)}
                      {p.allowances.length > 0 && ` · +${p.allowances.length} allowances`}
                    </div>
                  </td>
                  <td>
                    <div className="mono">{formatINR(p.totalDeductions)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                      {p.deductions.map((d) => `${d.name} ${formatINR(d.amount)}`).join(' · ')}
                    </div>
                  </td>
                  <td className="mono" style={{ fontWeight: 700 }}>{formatINR(p.net)}</td>
                  <td>
                    <span className={`badge ${p.status === 'Paid' ? 'green' : 'amber'}`}>{p.status}</span>
                    {p.paidOn && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{fmtDate(p.paidOn)}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {p.status !== 'Paid' && (
                        <button className="btn btn-primary btn-sm" onClick={() => markPaid(p)}>
                          <Check size={13} /> Mark paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <p>No payslips for {monthLabel(month)}. Click “Generate” to create them from salary structures.</p>
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
          title="Salary structures"
          onClose={() => setStructureModal(false)}
          width={680}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setStructureModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveStructures} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                Save structures
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <p style={{ fontSize: 12.5, color: 'var(--text-soft)', marginBottom: 14 }}>
            Basic, HRA and DA per teacher. Allowances and deductions can be added below each teacher.
          </p>
          {teachers.map((t) => {
            const st = structureForm[t._id] || {};
            return (
              <div key={t._id} className="notes-card" style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13.5 }}>{t.user?.name} <span className="mono" style={{ fontWeight: 400, color: 'var(--text-faint)' }}>{t.employeeId}</span></div>
                <div className="grid-3" style={{ marginBottom: 8 }}>
                  <div className="field" style={{ margin: 0 }}><label style={{ fontSize: 11 }}>Basic</label><input className="input" type="number" value={st.basic ?? ''} onChange={(e) => setStructureForm({ ...structureForm, [t._id]: { ...st, basic: e.target.value } })} /></div>
                  <div className="field" style={{ margin: 0 }}><label style={{ fontSize: 11 }}>HRA</label><input className="input" type="number" value={st.hra ?? ''} onChange={(e) => setStructureForm({ ...structureForm, [t._id]: { ...st, hra: e.target.value } })} /></div>
                  <div className="field" style={{ margin: 0 }}><label style={{ fontSize: 11 }}>DA</label><input className="input" type="number" value={st.da ?? ''} onChange={(e) => setStructureForm({ ...structureForm, [t._id]: { ...st, da: e.target.value } })} /></div>
                </div>
                {(st.allowances || []).map((a, i) => (
                  <div key={i} className="grid-3" style={{ marginBottom: 6 }}>
                    <input className="input" placeholder="Allowance name" value={a.name} onChange={(e) => setAllowance(t._id, 'allowances', i, 'name', e.target.value)} />
                    <input className="input" type="number" placeholder="Amount" value={a.amount} onChange={(e) => setAllowance(t._id, 'allowances', i, 'amount', e.target.value)} />
                    <button className="btn btn-ghost btn-sm" onClick={() => setStructureForm({ ...structureForm, [t._id]: { ...st, allowances: st.allowances.filter((_, j) => j !== i) } })}>✕</button>
                  </div>
                ))}
                {(st.deductions || []).map((d, i) => (
                  <div key={i} className="grid-3" style={{ marginBottom: 6 }}>
                    <input className="input" placeholder="Deduction name" value={d.name} onChange={(e) => setAllowance(t._id, 'deductions', i, 'name', e.target.value)} />
                    <input className="input" type="number" placeholder="Amount" value={d.amount} onChange={(e) => setAllowance(t._id, 'deductions', i, 'amount', e.target.value)} />
                    <button className="btn btn-ghost btn-sm" onClick={() => setStructureForm({ ...structureForm, [t._id]: { ...st, deductions: st.deductions.filter((_, j) => j !== i) } })}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStructureForm({ ...structureForm, [t._id]: { ...st, allowances: [...(st.allowances || []), { name: '', amount: 0 }] } })}>+ Allowance</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStructureForm({ ...structureForm, [t._id]: { ...st, deductions: [...(st.deductions || []), { name: '', amount: 0 }] } })}>+ Deduction</button>
                </div>
              </div>
            );
          })}
          {teachers.length === 0 && <div className="empty"><p>Add teachers first.</p></div>}
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}