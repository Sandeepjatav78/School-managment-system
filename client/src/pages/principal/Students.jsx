import { useEffect, useMemo, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import { Plus, Pencil, Trash2, Search, KeyRound } from 'lucide-react';

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const emptyForm = {
  name: '',
  email: '',
  password: '',
  admissionNo: '',
  rollNo: '',
  classId: '',
  phone: '',
  address: '',
  parentEmail: '',
  photo: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  guardianName: '',
  guardianPhone: '',
  emergencyContact: '',
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = () => {
    const params = filterClass ? { classId: filterClass } : {};
    return api.get('/students', { params }).then((r) => setStudents(r.data));
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load students'));
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClass]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.user.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        (s.user.email || '').toLowerCase().includes(q)
    );
  }, [students, search]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, classId: filterClass || '' });
    setError('');
    setModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.user.name,
      email: s.user.email,
      password: '',
      admissionNo: s.admissionNo,
      rollNo: s.rollNo ?? '',
      classId: s.class?._id || '',
      phone: s.phone || '',
      address: s.address || '',
      parentEmail: s.parent?.email || '',
      photo: s.photo || '',
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : '',
      gender: s.gender || '',
      bloodGroup: s.bloodGroup || '',
      guardianName: s.guardianName || '',
      guardianPhone: s.guardianPhone || '',
      emergencyContact: s.emergencyContact || '',
    });
    setError('');
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/students/${editing._id}`, {
          ...form,
          password: form.password || undefined,
          parentEmail: form.parentEmail || '',
        });
        showToast('Student updated');
      } else {
        await api.post('/students', { ...form, parentEmail: form.parentEmail || '' });
        showToast('Student enrolled');
      }
      setModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Remove ${s.user.name}?`)) return;
    try {
      await api.delete(`/students/${s._id}`);
      showToast('Student removed');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove student');
    }
  };

  const grantEdit = async (s) => {
    const days = window.prompt('Grant the student edit access for how many days?', '2');
    const n = Number(days);
    if (!days || isNaN(n) || n <= 0) return;
    try {
      await api.post(`/students/${s._id}/grant-edit`, { days: n });
      showToast(`${s.user.name} can now edit their profile for ${n} day(s)`);
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not grant access');
    }
  };

  const hasActiveAccess = (s) => s.editAccessUntil && new Date(s.editAccessUntil) > new Date();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p>{students.length} students enrolled.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus /> Enroll student
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-faint)' }} />
          <input
            className="input"
            placeholder="Search name, admission no…"
            style={{ paddingLeft: 34 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select" style={{ width: 190 }} value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No.</th>
                <th>Class</th>
                <th>Roll</th>
                <th>Parent</th>
                <th>Profile</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="cell-main">
                      {s.photo ? (
                        <img src={s.photo} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div className="avatar sm">{s.user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                      )}
                      {s.user.name}
                    </div>
                    <div className="cell-sub">{s.user.email}</div>
                  </td>
                  <td className="mono">{s.admissionNo}</td>
                  <td>
                    <span className="badge indigo">{s.class?.name || '—'}</span>
                  </td>
                  <td>{s.rollNo ?? '—'}</td>
                  <td>{s.parent?.name || <span style={{ color: 'var(--text-faint)' }}>Not linked</span>}</td>
                  <td>
                    {s.isProfileComplete ? (
                      <span className="badge green">Complete</span>
                    ) : (
                      <span className="badge amber">Incomplete</span>
                    )}
                    {hasActiveAccess(s) && (
                      <span className="badge gray" style={{ marginLeft: 5 }} title={`Edit access until ${new Date(s.editAccessUntil).toLocaleDateString()}`}>
                        <KeyRound size={11} /> Editing
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="icon-btn" onClick={() => grantEdit(s)} title="Grant profile edit access">
                        <KeyRound />
                      </button>
                      <button className="icon-btn" onClick={() => openEdit(s)} title="Edit">
                        <Pencil />
                      </button>
                      <button className="icon-btn danger" onClick={() => remove(s)} title="Remove">
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <p>No students found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal
          title={editing ? 'Edit student' : 'Enroll a student'}
          onClose={() => setModal(false)}
          width={560}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                {editing ? 'Save changes' : 'Enroll student'}
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={save}>
            <div className="form-row">
              <div className="field">
                <label>Full name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Email</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Password {editing && <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(blank = keep)</span>}</label>
                <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={6} />
              </div>
              <div className="field">
                <label>Admission No.</label>
                <input className="input" value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} required disabled={!!editing} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Class</label>
                <select className="select" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Roll number</label>
                <input className="input" type="number" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="field">
                <label>Parent account email (optional)</label>
                <input className="input" type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} placeholder="p1@school.com" />
              </div>
            </div>
            <div className="field">
              <label>Address</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Photo URL</label>
                <input className="input" value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} placeholder="https://…/photo.jpg" />
              </div>
              <div className="field">
                <label>Date of birth</label>
                <input className="input" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Gender</label>
                <select className="select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Select</option>
                  {GENDERS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Blood group</label>
                <select className="select" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Guardian name</label>
                <input className="input" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
              </div>
              <div className="field">
                <label>Guardian phone</label>
                <input className="input" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Emergency contact</label>
              <input className="input" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            </div>
          </form>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
