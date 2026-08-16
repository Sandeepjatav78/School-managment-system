import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import PrintDoc from '../../components/PrintDoc.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate, gradeColor } from '../../components/format.js';
import { CalendarClock, Ticket, Trophy, Printer } from 'lucide-react';

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [result, setResult] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/exams/mine')
      .then((r) => setExams(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const viewResult = async (e) => {
    try {
      const r = await api.get(`/exams/${e._id}/results`);
      setResult({ exam: e, ...r.data });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load result');
    }
  };

  const viewTicket = async (e) => {
    try {
      const r = await api.get(`/exams/${e._id}/hall-ticket`);
      setTicket(r.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load hall ticket');
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = exams.filter((e) => e.startDate >= today);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Exams & Results</h1>
          <p>Hall tickets, marks and report cards.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={CalendarClock} tone="indigo" value={upcoming.length} label="Upcoming exams" sub="Hall tickets ready" />
        <StatCard icon={Trophy} tone="green" value={exams.filter((e) => e.status === 'Result Published').length} label="Results published" sub="View your report card" />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Exam</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Subjects</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e._id}>
                  <td style={{ fontWeight: 600 }}>{e.name}</td>
                  <td><span className="badge indigo">{e.type}</span></td>
                  <td style={{ fontSize: 12.5 }}>{fmtDate(e.startDate)} → {fmtDate(e.endDate)}</td>
                  <td>
                    <div className="chip-row">
                      {e.subjects.map((s) => (
                        <span key={s._id} className="badge" style={{ background: `${s.subject?.color}18`, color: s.subject?.color }}>
                          {s.subject?.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td><span className={`badge ${e.status === 'Result Published' ? 'green' : e.status === 'In Progress' ? 'amber' : e.status === 'Completed' ? 'sky' : 'gray'}`}>{e.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {e.startDate >= today && (
                        <button className="btn btn-primary btn-sm" onClick={() => viewTicket(e)}>
                          <Ticket size={13} /> Hall ticket
                        </button>
                      )}
                      {e.status === 'Result Published' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => viewResult(e)}>
                          <Trophy size={13} /> Result
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty"><p>No exams scheduled for your class.</p></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {ticket && (
        <PrintDoc title="Hall Ticket" onClose={() => setTicket(null)}>
          <div className="doc">
            <div className="doc-head">
              <div className="school">Hall Ticket</div>
              <div className="addr">{ticket.exam.name} · {ticket.exam.type}</div>
            </div>
            <table className="doc-table">
              <tr>
                <td><strong>Name:</strong> {ticket.student.name}</td>
                <td><strong>Admission No:</strong> {ticket.student.admissionNo}</td>
              </tr>
              <tr>
                <td><strong>Class:</strong> {ticket.student.class}</td>
                <td><strong>Roll No:</strong> {ticket.student.rollNo}</td>
              </tr>
            </table>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Max Marks</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {ticket.exam.subjects.map((s) => (
                  <tr key={s._id}>
                    <td>{s.subject.name}</td>
                    <td>{s.maxMarks}</td>
                    <td>{fmtDate(s.date)}</td>
                    <td>{s.startTime || '—'}{s.endTime ? ` – ${s.endTime}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 11.5, color: '#666', textAlign: 'center', marginTop: 12 }}>
              Carry this hall ticket and your school identity card to the examination hall.
            </p>
            <div className="doc-sign">
              <div className="line">Invigilator</div>
              <div className="line">Principal</div>
            </div>
          </div>
        </PrintDoc>
      )}

      {result && (
        <PrintDoc title="Report Card" onClose={() => setResult(null)}>
          <div className="report-card">
            <div className="doc">
              <div className="doc-head">
                <div className="school">{result.exam.name}</div>
                <div className="addr">Type: {result.exam.type}</div>
              </div>
              <div className="doc-body">
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th style={{ textAlign: 'center' }}>Max</th>
                      <th style={{ textAlign: 'center' }}>Obtained</th>
                      <th style={{ textAlign: 'center' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr key={row.subject._id}>
                        <td>{row.subject.name}</td>
                        <td style={{ textAlign: 'center' }}>{row.maxMarks}</td>
                        <td style={{ textAlign: 'center' }}>{row.marksObtained ?? '—'}</td>
                        <td style={{ textAlign: 'center' }}>{row.grade || '—'}</td>
                      </tr>
                    ))}
                    <tr>
                      <td><strong>Total</strong></td>
                      <td style={{ textAlign: 'center' }}><strong>{result.maxTotal}</strong></td>
                      <td style={{ textAlign: 'center' }}><strong>{result.totalObtained ?? '—'}</strong></td>
                      <td style={{ textAlign: 'center' }}><strong>{result.grade || '—'}</strong></td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, marginTop: 8 }}>
                  Percentage: {result.percentage != null ? `${result.percentage}%` : '—'}
                  {result.grade && <span className="badge" style={{ marginLeft: 10, background: 'var(--green-soft)', color: 'var(--green)', fontSize: 13 }}>{result.grade}</span>}
                </div>
              </div>
            </div>
          </div>
        </PrintDoc>
      )}
    </>
  );
}