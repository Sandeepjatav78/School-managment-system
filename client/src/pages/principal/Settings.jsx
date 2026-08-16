import { useEffect, useState } from 'react';
import api from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Save, School as SchoolIcon } from 'lucide-react';

export default function Settings() {
  const { refresh } = useAuth();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  useEffect(() => {
    api.get('/settings').then((r) => setForm(r.data)).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/settings', form);
      showToast('School profile saved');
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>School Profile</h1>
          <p>Official details used on certificates, receipts and hall tickets.</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          <Save size={15} /> Save changes
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div className="stat-icon indigo"><SchoolIcon /></div>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>School details</h2>
          </div>
          <div className="grid-2">
            <div className="field"><label>School name</label><input className="input" value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="field"><label>Tagline</label><input className="input" value={form.tagline || ''} onChange={(e) => set('tagline', e.target.value)} /></div>
          </div>
          <div className="field"><label>Address</label><input className="input" value={form.address || ''} onChange={(e) => set('address', e.target.value)} /></div>
          <div className="grid-3">
            <div className="field"><label>City</label><input className="input" value={form.city || ''} onChange={(e) => set('city', e.target.value)} /></div>
            <div className="field"><label>Pincode</label><input className="input" value={form.pincode || ''} onChange={(e) => set('pincode', e.target.value)} /></div>
            <div className="field"><label>Established</label><input className="input" value={form.established || ''} onChange={(e) => set('established', e.target.value)} /></div>
          </div>
          <div className="grid-3">
            <div className="field"><label>Phone</label><input className="input" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
            <div className="field"><label>Email</label><input className="input" value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></div>
            <div className="field"><label>Website</label><input className="input" value={form.website || ''} onChange={(e) => set('website', e.target.value)} /></div>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-pad">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Affiliation & session</h2>
          <div className="grid-2">
            <div className="field"><label>Board</label><input className="input" value={form.board || ''} onChange={(e) => set('board', e.target.value)} /></div>
            <div className="field"><label>Medium of instruction</label><input className="input" value={form.medium || ''} onChange={(e) => set('medium', e.target.value)} /></div>
          </div>
          <div className="grid-3">
            <div className="field"><label>Affiliation number</label><input className="input" value={form.affiliationNo || ''} onChange={(e) => set('affiliationNo', e.target.value)} /></div>
            <div className="field"><label>UDISE code</label><input className="input" value={form.udiseCode || ''} onChange={(e) => set('udiseCode', e.target.value)} /></div>
            <div className="field"><label>Academic year</label><input className="input" value={form.academicYear || ''} placeholder="e.g. 2026-27" onChange={(e) => set('academicYear', e.target.value)} /></div>
          </div>
          <div className="grid-2">
            <div className="field"><label>Session starts</label><input className="input" value={form.sessionStart || ''} onChange={(e) => set('sessionStart', e.target.value)} /></div>
            <div className="field"><label>Session ends</label><input className="input" value={form.sessionEnd || ''} onChange={(e) => set('sessionEnd', e.target.value)} /></div>
          </div>
          <div className="field"><label>Principal's name (for certificates)</label><input className="input" value={form.principalName || ''} onChange={(e) => set('principalName', e.target.value)} /></div>
          <div className="field"><label>Logo URL</label><input className="input" value={form.logoUrl || ''} onChange={(e) => set('logoUrl', e.target.value)} /></div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-pad">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Enabled facilities</h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-soft)', marginBottom: 14 }}>
            Turn a facility off if the school does not provide it (e.g. no hostel, no transport). The feature is then hidden for all users and cannot be accessed.
          </p>
          <div className="grid-2">
            {Object.keys(form.features || {}).map((key) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 14px',
                  border: `1px solid ${form.features?.[key] ? 'var(--border-strong)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: 13.5,
                  fontWeight: 600,
                  background: form.features?.[key] ? 'var(--primary-soft)' : 'var(--surface)',
                  color: form.features?.[key] ? 'var(--primary)' : 'var(--text-soft)',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!form.features?.[key]}
                  onChange={(e) => set('features', { ...form.features, [key]: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                />
                <span style={{ textTransform: 'capitalize' }}>{key}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}