import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import PrintDoc from '../../components/PrintDoc.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { Award, Plus, Printer, Ban, ScrollText } from 'lucide-react';

export default function Certificates() {
  const [list, setList] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [students, setStudents] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ template: 'Bonafide', studentId: '', purpose: '' });
  const [printData, setPrintData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () =>
    api.get('/certificates').then((r) => {
      setList(r.data.list);
      setTemplates(r.data.templates);
    });

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
    api.get('/students').then((r) => setStudents(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const issue = async () => {
    setSaving(true);
    setError('');
    try {
      const r = await api.post('/certificates', form);
      showToast(`Issued ${r.data.template} — ${r.data.serialNo}`);
      setModal(false);
      setForm({ template: 'Bonafide', studentId: '', purpose: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not issue certificate');
    } finally {
      setSaving(false);
    }
  };

  const print = async (c) => {
    try {
      const r = await api.get(`/certificates/${c._id}/print`);
      setPrintData(r.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not load certificate');
    }
  };

  const revoke = async (c) => {
    if (!confirm(`Revoke ${c.serialNo}?`)) return;
    try {
      await api.put(`/certificates/${c._id}/revoke`);
      showToast('Certificate revoked');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not revoke');
    }
  };

  const certBody = (data) => {
    const { cert, student, school } = data;
    const fullName = student?.user?.name || 'Student';
    const templateText = {
      Bonafide: `This is to certify that ${fullName}, son/daughter of ${student?.guardianName || '________________'}, is a bonafide student of ${school.name}, studying in ${student?.class?.name || '______'} during the academic session ${school.academicYear || '______'}. ${cert.purpose ? `This certificate is being issued for the purpose of ${cert.purpose}.` : ''}`,
      'Transfer Certificate': `This is to certify that ${fullName}, son/daughter of ${student?.guardianName || '________________'}, was a student of ${school.name} studying in ${student?.class?.name || '______'} during the academic session ${school.academicYear || '______'}. The student is of good character and conduct. To the best of our knowledge there is no objection to his/her transfer to another institution.`,
      'Character Certificate': `This is to certify that ${fullName}, son/daughter of ${student?.guardianName || '________________'}, was a student of ${school.name} studying in ${student?.class?.name || '______'}. During the period of study the student's conduct and character were found to be good. ${cert.purpose ? `This certificate is issued for the purpose of ${cert.purpose}.` : ''}`,
      'Study Certificate': `This is to certify that ${fullName}, son/daughter of ${student?.guardianName || '________________'}, has been studying in ${school.name} in ${student?.class?.name || '______'} during the academic session ${school.academicYear || '______'}.`,
      'School Leaving': `This is to certify that ${fullName}, son/daughter of ${student?.guardianName || '________________'}, has left ${school.name} after completing studies in ${student?.class?.name || '______'} during the academic session ${school.academicYear || '______'}. The student is hereby relieved of all school obligations.`,
    };
    return templateText[cert.template] || '';
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Certificates</h1>
          <p>Bonafide, transfer, character and study certificates.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={15} /> Issue certificate
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={Award} tone="indigo" value={list.length} label="Certificates issued" sub="All templates" />
        <StatCard icon={ScrollText} tone="green" value={templates.length} label="Templates" sub={templates.join(', ')} />
        <StatCard icon={Ban} tone="red" value={list.filter((c) => c.status === 'Revoked').length} label="Revoked" sub="No longer valid" />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Serial no.</th>
                <th>Student</th>
                <th>Template</th>
                <th>Purpose</th>
                <th>Issued on</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id}>
                  <td className="mono">{c.serialNo}</td>
                  <td>
                    <div className="cell-main">
                      <div className="avatar sm">{c.student?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                      {c.student?.name || '—'}
                    </div>
                  </td>
                  <td><span className="badge indigo">{c.template}</span></td>
                  <td style={{ fontSize: 12.5 }}>{c.purpose || '—'}</td>
                  <td style={{ fontSize: 12.5 }}>{fmtDate(c.issuedDate)}</td>
                  <td><span className={`badge ${c.status === 'Issued' ? 'green' : 'red'}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => print(c)}>
                        <Printer size={13} /> Print
                      </button>
                      {c.status === 'Issued' && (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => revoke(c)}>
                          <Ban size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty"><p>No certificates issued yet.</p></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal
          title="Issue certificate"
          onClose={() => setModal(false)}
          width={500}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={issue} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                Issue
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <div className="rows-gap">
            <div className="field">
              <label>Template</label>
              <select className="select" value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })}>
                {templates.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Student</label>
              <select className="select" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                <option value="">Select student</option>
                {students.map((s) => <option key={s._id} value={s.user?._id}>{s.user?.name} — {s.class?.name} ({s.admissionNo})</option>)}
              </select>
            </div>
            <div className="field"><label>Purpose</label><input className="input" value={form.purpose} placeholder="e.g. Bank account opening" onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
          </div>
        </Modal>
      )}

      {printData && (
        <PrintDoc title={`${printData.cert.template} — ${printData.serialNo}`} onClose={() => setPrintData(null)}>
          <div className="doc">
            <div className="doc-head">
              <div className="school">{printData.school.name}</div>
              {printData.school.tagline && <div className="tagline">{printData.school.tagline}</div>}
              <div className="addr">
                {printData.school.address}{printData.school.city ? `, ${printData.school.city}` : ''} {printData.school.pincode || ''}
                {printData.school.phone && ` · ${printData.school.phone}`}
                {printData.school.affiliationNo && ` · Affl. No. ${printData.school.affiliationNo}`}
              </div>
            </div>
            <div className="cert-preview">
              <div className="serial">Serial No: {printData.cert.serialNo}</div>
              <div className="title">{printData.cert.template}</div>
              <div className="body">{certBody(printData)}</div>
            </div>
            <table className="doc-table">
              <tr>
                <td><strong>Issued on:</strong> {fmtDate(printData.cert.issuedDate)}</td>
                <td><strong>Valid until:</strong> {fmtDate(printData.cert.validUntil)}</td>
              </tr>
            </table>
            <div className="doc-sign">
              <div className="line">Registrar / Office</div>
              <div className="line">{printData.principalName} — Principal</div>
            </div>
          </div>
        </PrintDoc>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}