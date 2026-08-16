import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate } from '../../components/format.js';
import { BookOpenCheck, Send, Clock, CheckCircle2 } from 'lucide-react';

export default function Homework() {
  const [items, setItems] = useState([]);
  const [submitFor, setSubmitFor] = useState(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () =>
    api.get('/homework').then((r) => setItems(r.data));

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/homework/${submitFor._id}/submit`, { text });
      setSubmitFor(null);
      setText('');
      showToast('Homework submitted');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit');
    } finally {
      setSaving(false);
    }
  };

  const pending = items.filter((h) => !h.mySubmission);
  const submitted = items.filter((h) => h.mySubmission);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Homework</h1>
          <p>Complete and submit your assignments before the deadline.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={BookOpenCheck} tone="indigo" value={pending.length} label="Pending homework" sub="To be submitted" />
        <StatCard icon={CheckCircle2} tone="green" value={submitted.length} label="Submitted" sub="Done and dusted" />
        <StatCard icon={Clock} tone="amber" value={items.filter((h) => h.overdue && !h.mySubmission).length} label="Overdue" sub="Past due date — still submit!" />
      </div>

      <div className="grid-2">
        {items.map((h) => (
          <div className="card" key={h._id} style={{ opacity: h.mySubmission && h.mySubmission.status !== 'Late' ? 0.75 : 1 }}>
            <div className="card-pad">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div className="stat-icon indigo"><BookOpenCheck /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{h.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                    <span className="badge" style={{ background: `${h.subject?.color}18`, color: h.subject?.color, marginRight: 6 }}>{h.subject?.name}</span>
                    {h.class?.name}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: '0 0 8px' }}>{h.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                {h.dueDate ? (
                  <>
                    <Clock size={13} style={{ color: 'var(--text-faint)' }} />
                    Due {fmtDate(h.dueDate)}
                    <span className={`badge ${h.overdue ? 'red' : new Date(h.dueDate) - new Date() < 24 * 60 * 60 * 1000 ? 'amber' : 'green'}`}>
                      {h.overdue ? 'overdue' : new Date(h.dueDate) - new Date() < 24 * 60 * 60 * 1000 ? 'due soon' : 'on time'}
                    </span>
                  </>
                ) : (
                  <span className="badge gray">No deadline</span>
                )}
                {h.mySubmission && (
                  <span className={`badge ${h.mySubmission.status === 'Checked' ? 'green' : 'sky'}`}>
                    {h.mySubmission.status} {h.mySubmission.grade && `· Grade ${h.mySubmission.grade}`}
                  </span>
                )}
              </div>
              {h.mySubmission?.text && (
                <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '8px 0 0', fontStyle: 'italic' }}>“{h.mySubmission.text.slice(0, 90)}{h.mySubmission.text.length > 90 ? '…' : ''}”</p>
              )}
              {h.canSubmit && (
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setSubmitFor(h)}>
                    <Send size={13} /> {h.mySubmission ? 'Resubmit' : 'Submit'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="card"><div className="empty"><p>No homework assigned yet.</p></div></div>
        )}
      </div>

      {submitFor && (
        <Modal
          title={`Submit — ${submitFor.title}`}
          onClose={() => setSubmitFor(null)}
          width={520}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setSubmitFor(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                <Send size={14} /> Submit
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <div className="field">
            <label>Your answer / work done</label>
            <textarea className="input" rows={6} value={text} placeholder="Write your solution or describe the work you completed…" onChange={(e) => setText(e.target.value)} />
          </div>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}