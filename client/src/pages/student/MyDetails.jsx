import { useEffect, useState } from 'react';
import api from '../../api.js';
import { Camera, Clock, ShieldCheck, Save, CheckCircle2 } from 'lucide-react';

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function StudentMyDetails() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    api
      .get('/student/profile')
      .then((r) => {
        setData(r.data);
        const p = r.data.profile;
        setForm({
          photo: p.photo || '',
          phone: p.phone || '',
          address: p.address || '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
          gender: p.gender || '',
          bloodGroup: p.bloodGroup || '',
          guardianName: p.guardianName || '',
          guardianPhone: p.guardianPhone || '',
          emergencyContact: p.emergencyContact || '',
        });
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load profile'));
  }, []);

  if (!data) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  const { profile, user } = data;
  const canEdit = profile.hasEditAccess;
  const complete = profile.isProfileComplete;

  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data: updated } = await api.put('/student/profile', form);
      setData((d) => ({ ...d, profile: updated.profile }));
      setToast('Profile updated');
      setTimeout(() => setToast(''), 2600);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const InfoRow = ({ label, value }) => (
    <tr>
      <td style={{ width: 220, color: 'var(--text-faint)', fontWeight: 600 }}>{label}</td>
      <td className="cell-main">{value || <span style={{ color: 'var(--text-faint)', fontWeight: 500 }}>Not provided</span>}</td>
    </tr>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My details</h1>
          <p>Your information on file with the school.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!complete && (
        <div className="card" style={{ background: 'var(--amber-soft)', borderColor: '#fde68a', marginBottom: 18 }}>
          <div className="card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div className="stat-icon amber" style={{ width: 38, height: 38 }}>
              <Clock />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Your profile is incomplete</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-soft)', marginTop: 3 }}>
                {canEdit
                  ? 'Please add your photo and remaining details below.'
                  : 'Ask the school office to grant you edit access so you can complete it.'}
              </div>
            </div>
            {canEdit && <span className="badge amber">Edit access active</span>}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card card-pad">
          <div className="card-title">
            Photo
            {canEdit && (
              <span className="badge green">
                <ShieldCheck size={12} /> Editing enabled
              </span>
            )}
          </div>

          {form.photo ? (
            <img
              src={form.photo}
              alt="Student"
              style={{ width: 128, height: 128, borderRadius: 20, objectFit: 'cover', border: '1px solid var(--border)' }}
            />
          ) : (
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: 20,
                background: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 40,
                fontWeight: 800,
                border: '1px dashed var(--border-strong)',
              }}
            >
              {initials}
            </div>
          )}

          {canEdit ? (
            <div className="field" style={{ marginTop: 14 }}>
              <label>
                <Camera size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
                Photo URL
              </label>
              <input className="input" value={form.photo} onChange={(e) => set('photo', e.target.value)} placeholder="https://…/photo.jpg" />
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 12 }}>
              Photo can only be changed while the school has granted you edit access.
            </p>
          )}
        </div>

        <div className="card">
          <div className="card-pad">
            <div className="card-title">On file with the school</div>
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  <InfoRow label="Full name" value={user.name} />
                  <InfoRow label="Email" value={user.email} />
                  <InfoRow label="Admission No." value={profile.admissionNo} />
                  <InfoRow label="Class" value={profile.class?.name} />
                  <InfoRow label="Roll No." value={profile.rollNo} />
                  <InfoRow label="Date of birth" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} />
                  <InfoRow label="Gender" value={profile.gender} />
                  <InfoRow label="Blood group" value={profile.bloodGroup} />
                  <InfoRow label="Guardian" value={profile.guardianName} />
                  <InfoRow label="Guardian phone" value={profile.guardianPhone} />
                  <InfoRow label="Emergency contact" value={profile.emergencyContact} />
                  <InfoRow label="Parent account" value={profile.parent?.name} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-pad">
          <div className="card-title">
            Edit your details
            {canEdit ? (
              <span className="badge green">Expires {new Date(profile.editAccessUntil).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
            ) : (
              <span className="badge gray">Locked by the school</span>
            )}
          </div>

          {!canEdit && (
            <div className="empty" style={{ padding: '18px 0' }}>
              <p>
                The principal has not granted you edit access yet. Ask the school office to enable it for a
                limited time — then you can add or fix your own details.
              </p>
            </div>
          )}

          {canEdit && (
            <form onSubmit={save}>
              <div className="form-row">
                <div className="field">
                  <label>Date of birth</label>
                  <input className="input" type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
                </div>
                <div className="field">
                  <label>Gender</label>
                  <select className="select" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                    <option value="">Select</option>
                    {GENDERS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Blood group</label>
                  <select className="select" value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Guardian name</label>
                  <input className="input" value={form.guardianName} onChange={(e) => set('guardianName', e.target.value)} />
                </div>
                <div className="field">
                  <label>Guardian phone</label>
                  <input className="input" value={form.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Emergency contact</label>
                  <input className="input" value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} />
                </div>
                <div className="field">
                  <label>Address</label>
                  <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} />
                </div>
              </div>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : <Save size={14} />}
                Save my details
              </button>
              {complete && (
                <span className="badge green" style={{ marginLeft: 12 }}>
                  <CheckCircle2 size={12} /> Profile complete
                </span>
              )}
            </form>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
