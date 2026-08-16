import { useEffect, useState } from 'react';
import api from '../../api.js';
import PrintDoc from '../../components/PrintDoc.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { Award, Printer, Ban } from 'lucide-react';

export default function Certificates() {
  const [list, setList] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/certificates')
      .then((r) => {
        setList(r.data.list);
        setTemplates(r.data.templates);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const print = async (c) => {
    try {
      const r = await api.get(`/certificates/${c._id}/print`);
      setPrintData(r.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load certificate');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My Certificates</h1>
          <p>Bonafide and other certificates issued to you.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={Award} tone="indigo" value={list.length} label="Certificates issued" sub="To you" />
        <StatCard icon={Ban} tone="red" value={list.filter((c) => c.status === 'Revoked').length} label="Revoked" sub="No longer valid" />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Serial no.</th>
                <th>Template</th>
                <th>Purpose</th>
                <th>Issued on</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id}>
                  <td className="mono">{c.serialNo}</td>
                  <td><span className="badge indigo">{c.template}</span></td>
                  <td style={{ fontSize: 12.5 }}>{c.purpose || '—'}</td>
                  <td style={{ fontSize: 12.5 }}>{fmtDate(c.issuedDate)}</td>
                  <td><span className={`badge ${c.status === 'Issued' ? 'green' : 'red'}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {c.status === 'Issued' && (
                        <button className="btn btn-primary btn-sm" onClick={() => print(c)}>
                          <Printer size={13} /> Print / Download
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <p>No certificates issued yet.</p>
                      <p style={{ fontSize: 12 }}>Request one from the school office when needed.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {printData && (
        <PrintDoc title={`${printData.cert.template} — ${printData.serialNo}`} onClose={() => setPrintData(null)}>
          <div className="doc">
            <div className="doc-head">
              <div className="school">{printData.school.name}</div>
              {printData.school.tagline && <div className="tagline">{printData.school.tagline}</div>}
              <div className="addr">
                {printData.school.address}{printData.school.city ? `, ${printData.school.city}` : ''} {printData.school.pincode || ''}
                {printData.school.affiliationNo && ` · Affl. No. ${printData.school.affiliationNo}`}
              </div>
            </div>
            <div className="cert-preview">
              <div className="serial">Serial No: {printData.cert.serialNo}</div>
              <div className="title">{printData.cert.template}</div>
              <div className="body">
                {printData.cert.template === 'Bonafide' && (
                  <>This is to certify that <strong>{printData.student?.user?.name}</strong>, son/daughter of {printData.student?.guardianName || '________________'}, is a bonafide student of {printData.school.name}, studying in {printData.student?.class?.name || '______'} during the academic session {printData.school.academicYear || '______'}.{printData.cert.purpose ? ` This certificate is being issued for the purpose of ${printData.cert.purpose}.` : ''}</>
                )}
                {printData.cert.template === 'Transfer Certificate' && (
                  <>This is to certify that <strong>{printData.student?.user?.name}</strong>, son/daughter of {printData.student?.guardianName || '________________'}, was a student of {printData.school.name} studying in {printData.student?.class?.name || '______'}. The student is of good character and conduct, and there is no objection to his/her transfer.</>
                )}
                {printData.cert.template === 'Character Certificate' && (
                  <>This is to certify that <strong>{printData.student?.user?.name}</strong>, son/daughter of {printData.student?.guardianName || '________________'}, was a student of {printData.school.name}. During the period of study the student's conduct and character were found to be good.</>
                )}
                {printData.cert.template === 'Study Certificate' && (
                  <>This is to certify that <strong>{printData.student?.user?.name}</strong>, son/daughter of {printData.student?.guardianName || '________________'}, has been studying in {printData.school.name} in {printData.student?.class?.name || '______'} during the academic session {printData.school.academicYear || '______'}.</>
                )}
                {printData.cert.template === 'School Leaving' && (
                  <>This is to certify that <strong>{printData.student?.user?.name}</strong>, son/daughter of {printData.student?.guardianName || '________________'}, has left {printData.school.name} after completing studies in {printData.student?.class?.name || '______'}. The student is hereby relieved of all school obligations.</>
                )}
              </div>
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
    </>
  );
}