import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { Users, FilePlus2, PhoneCall, CheckCircle2, Plus, Pencil, Trash2, GraduationCap, Armchair } from 'lucide-react';

const ENQ_STATUS = ['New', 'Contacted', 'Converted', 'Closed'];
const APP_STATUS = ['Applied', 'Under Review', 'Interview Scheduled', 'Admitted', 'Rejected', 'Withdrawn'];

export default function Admissions() {
  const [tab, setTab] = useState('enquiries');
  const [classes, setClasses] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [enqSummary, setEnqSummary] = useState({});
  const [apps, setApps] = useState([]);
  const [appSummary, setAppSummary] = useState({});
  const [seats, setSeats] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () => {
    return Promise.all([
      api.get('/admissions/enquiries').then((r) => {
        setEnquiries(r.data.list);
        setEnqSummary(r.data.summary);
      }),
      api.get('/admissions/applications').then((r) => {
        setApps(r.data.list);
        setAppSummary(r.data.summary);
      }),
      api.get('/admissions/seats').then((r) => setSeats(r.data)),
      api.get('/classes').then((r) => setClasses(r.data)),
    ]);
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = (kind) => {
    setModal(kind);
    setForm(kind === 'enquiry' ? { name: '', phone: '', email: '', classApplying: '', source: 'Website', message: '', status: 'New' } : { firstName: '', lastName: '', dateOfBirth: '', gender: '', classApplying: '', parentName: '', parentPhone: '', parentEmail: '', address: '', previousSchool: '', status: 'Applied' });
  };

  const openEdit = (kind, doc) => {
    setModal(kind);
    setForm({ ...doc, classApplying: doc.classApplying?._id || '' });
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const kind = modal;
      const base = kind === 'enquiry' ? '/admissions/enquiries' : '/admissions/applications';
      if (form._id) await api.put(`${base}/${form._id}`, form);
      else await api.post(base, form);
      setModal(null);
      showToast(kind === 'enquiry' ? 'Enquiry saved' : 'Application saved');
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
      const base = kind === 'enquiry' ? '/admissions/enquiries' : '/admissions/applications';
      await api.delete(`${base}/${doc._id}`);
      showToast('Deleted');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete');
    }
  };

  const admit = async (app) => {
    if (!confirm(`Admit ${app.firstName} ${app.lastName} into ${app.classApplying?.name}? A student account will be created.`)) return;
    try {
      const r = await api.post(`/admissions/applications/${app._id}/admit`);
      showToast(r.data.message);
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not admit');
    }
  };

  const appBadge = (s) => (s === 'Admitted' ? 'green' : s === 'Rejected' ? 'red' : s === 'Interview Scheduled' ? 'amber' : s === 'Under Review' ? 'sky' : 'gray');

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Admissions</h1>
          <p>Enquiries, admission applications and seat availability.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openNew('application')}>
          <FilePlus2 size={15} /> New application
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={Users} tone="indigo" value={enqSummary.New || 0} label="New enquiries" sub={`${enqSummary.Contacted || 0} contacted · ${enqSummary.Converted || 0} converted`} />
        <StatCard icon={FilePlus2} tone="amber" value={appSummary.Applied || 0} label="Pending applications" sub={`${appSummary['Under Review'] || 0} under review · ${appSummary['Interview Scheduled'] || 0} interview`} />
        <StatCard icon={CheckCircle2} tone="green" value={appSummary.Admitted || 0} label="Admitted" sub={`${appSummary.Rejected || 0} rejected`} />
        <StatCard icon={Armchair} tone="sky" value={seats.reduce((s, x) => s + x.available, 0)} label="Seats available" sub="Across all classes" />
      </div>

      <div className="tabs">
        <button className={tab === 'enquiries' ? 'on' : ''} onClick={() => setTab('enquiries')}><PhoneCall size={14} /> Enquiries ({enquiries.length})</button>
        <button className={tab === 'applications' ? 'on' : ''} onClick={() => setTab('applications')}><FilePlus2 size={14} /> Applications ({apps.length})</button>
        <button className={tab === 'seats' ? 'on' : ''} onClick={() => setTab('seats')}><Armchair size={14} /> Seat availability</button>
      </div>

      {tab === 'enquiries' && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Class applying</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((e) => (
                  <tr key={e._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{e.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{e.message}</div>
                    </td>
                    <td>
                      <div>{e.phone}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{e.email}</div>
                    </td>
                    <td><span className="badge indigo">{e.classApplying?.name || '—'}</span></td>
                    <td>{e.source}</td>
                    <td>
                      <select
                        className="select"
                        style={{ width: 130, padding: '5px 8px', fontSize: 12 }}
                        value={e.status}
                        onChange={async (ev) => {
                          await api.put(`/admissions/enquiries/${e._id}`, { status: ev.target.value });
                          showToast('Status updated');
                          await load();
                        }}
                      >
                        {ENQ_STATUS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{e.followUpDate || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit('enquiry', e)}><Pencil size={13} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => remove('enquiry', e)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {enquiries.length === 0 && (
                  <tr><td colSpan={7}><div className="empty"><p>No enquiries yet.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'applications' && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Parent</th>
                  <th>Status</th>
                  <th>Applied on</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a._id}>
                    <td><span className="mono">{a.applicationNo}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.firstName} {a.lastName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{a.gender} · DOB {a.dateOfBirth || '—'}</div>
                    </td>
                    <td><span className="badge indigo">{a.classApplying?.name || '—'}</span></td>
                    <td>
                      <div>{a.parentName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{a.parentPhone}</div>
                    </td>
                    <td><span className={`badge ${appBadge(a.status)}`}>{a.status}</span></td>
                    <td style={{ fontSize: 12.5 }}>{fmtDate(a.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {a.status !== 'Admitted' && (
                          <button className="btn btn-primary btn-sm" onClick={() => admit(a)}>
                            <GraduationCap size={13} /> Admit
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit('application', a)}><Pencil size={13} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => remove('application', a)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {apps.length === 0 && (
                  <tr><td colSpan={7}><div className="empty"><p>No applications yet.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'seats' && (
        <div className="grid-3">
          {seats.map((s) => (
            <div className="card" key={s.class._id}>
              <div className="card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="stat-icon indigo"><Armchair /></div>
                  <div style={{ fontWeight: 700 }}>{s.class.name}</div>
                </div>
                <div className="kv"><span className="k">Enrolled</span><span className="v">{s.enrolled}</span></div>
                <div className="kv"><span className="k">Capacity</span><span className="v">{s.capacity}</span></div>
                <div className="kv"><span className="k">Seats available</span><span className="v" style={{ color: s.available > 0 ? 'var(--green)' : 'var(--red)' }}>{s.available}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === 'enquiry' ? (form._id ? 'Edit enquiry' : 'New enquiry') : form._id ? 'Edit application' : 'New admission application'}
          onClose={() => setModal(null)}
          width={560}
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
          {modal === 'enquiry' ? (
            <div className="rows-gap">
              <div className="grid-2">
                <div className="field"><label>Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="field">
                  <label>Class applying</label>
                  <select className="select" value={form.classApplying} onChange={(e) => setForm({ ...form, classApplying: e.target.value })}>
                    <option value="">Any</option>
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Source</label>
                  <select className="select" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                    {['Website', 'Walk-in', 'Phone', 'Referral', 'Ad', 'Other'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field"><label>Follow-up date</label><input className="input" type="date" value={form.followUpDate || ''} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} /></div>
              </div>
              <div className="field"><label>Message</label><textarea className="input" rows={3} value={form.message || ''} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            </div>
          ) : (
            <div className="rows-gap">
              <div className="grid-2">
                <div className="field"><label>First name</label><input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                <div className="field"><label>Last name</label><input className="input" value={form.lastName || ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Date of birth</label><input className="input" type="date" value={form.dateOfBirth || ''} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
                <div className="field">
                  <label>Gender</label>
                  <select className="select" value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">—</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Class applying</label>
                  <select className="select" value={form.classApplying} onChange={(e) => setForm({ ...form, classApplying: e.target.value })}>
                    <option value="">Select class</option>
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field"><label>Previous school</label><input className="input" value={form.previousSchool || ''} onChange={(e) => setForm({ ...form, previousSchool: e.target.value })} /></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Parent name</label><input className="input" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} /></div>
                <div className="field"><label>Parent phone</label><input className="input" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} /></div>
              </div>
              <div className="grid-2">
                <div className="field"><label>Parent email</label><input className="input" value={form.parentEmail || ''} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} /></div>
                <div className="field"><label>Address</label><input className="input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              </div>
              <div className="field">
                <label>Status</label>
                <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {APP_STATUS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}