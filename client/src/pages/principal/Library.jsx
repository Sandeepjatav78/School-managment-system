import { useEffect, useState } from 'react';
import api from '../../api.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate, formatINR } from '../../components/format.js';
import { Library, BookOpen, Plus, Pencil, Trash2, ArrowLeftRight, RotateCcw } from 'lucide-react';

export default function LibraryPage() {
  const [tab, setTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ titles: 0, copies: 0, available: 0 });
  const [issues, setIssues] = useState([]);
  const [issueStats, setIssueStats] = useState({ issued: 0, overdue: 0, fine: 0 });
  const [students, setStudents] = useState([]);
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '', dueDays: 14 });
  const [returnModal, setReturnModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = () => {
    const params = {};
    if (q) params.q = q;
    if (catFilter) params.category = catFilter;
    return Promise.all([
      api.get('/library/books', { params }).then((r) => {
        setBooks(r.data.books);
        setCategories(r.data.categories);
        setStats(r.data.stats);
      }),
      api.get('/library/issues').then((r) => {
        setIssues(r.data.issues);
        setIssueStats(r.data.stats);
      }),
    ]);
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
    api.get('/students').then((r) => setStudents(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = () => load();

  const openNewBook = () => {
    setForm({ title: '', author: '', isbn: '', category: 'General', publisher: '', lang: 'English', rack: '', copies: 1, price: 0 });
    setModal('book');
  };

  const openEditBook = (b) => {
    setForm({ ...b, copies: b.copies });
    setModal('book');
  };

  const saveBook = async () => {
    setSaving(true);
    setError('');
    try {
      if (form._id) await api.put(`/library/books/${form._id}`, form);
      else await api.post('/library/books', form);
      setModal(null);
      showToast('Book saved');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save book');
    } finally {
      setSaving(false);
    }
  };

  const removeBook = async (b) => {
    if (!confirm(`Remove "${b.title}" from catalogue?`)) return;
    try {
      await api.delete(`/library/books/${b._id}`);
      showToast('Book removed');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove');
    }
  };

  const issue = async () => {
    setSaving(true);
    setError('');
    try {
      const r = await api.post('/library/issues', issueForm);
      showToast(`Issued "${r.data.book.title}"`);
      setModal(null);
      setIssueForm({ bookId: '', studentId: '', dueDays: 14 });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not issue');
    } finally {
      setSaving(false);
    }
  };

  const doReturn = async (issueId, fine) => {
    try {
      await api.post(`/library/issues/${issueId}/return`, { fine });
      showToast(`Returned — fine ${formatINR(fine)}`);
      setReturnModal(null);
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not return');
    }
  };

  const isOverdue = (i) => i.status === 'Issued' && new Date(i.dueDate) < new Date();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Library</h1>
          <p>Book catalogue, issues and returns.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setModal('issue')}>
            <ArrowLeftRight size={15} /> Issue book
          </button>
          <button className="btn btn-primary" onClick={openNewBook}>
            <Plus size={15} /> Add book
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={BookOpen} tone="indigo" value={stats.titles} label="Book titles" sub={`${stats.copies} total copies`} />
        <StatCard icon={Library} tone="green" value={stats.available} label="Available copies" sub={`${stats.copies - stats.available} on loan`} />
        <StatCard icon={ArrowLeftRight} tone="amber" value={issueStats.issued} label="Issued now" sub={`${issueStats.overdue} overdue`} />
        <StatCard icon={RotateCcw} tone="red" value={formatINR(issueStats.fine)} label="Total fines" sub="Collected on returns" />
      </div>

      <div className="tabs">
        <button className={tab === 'books' ? 'on' : ''} onClick={() => setTab('books')}><BookOpen size={14} /> Catalogue ({books.length})</button>
        <button className={tab === 'issues' ? 'on' : ''} onClick={() => setTab('issues')}><ArrowLeftRight size={14} /> Issues ({issues.length})</button>
      </div>

      {tab === 'books' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <input
              className="input"
              style={{ width: 260 }}
              placeholder="Search title, author, ISBN…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <select className="select" style={{ width: 160 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-ghost" onClick={search}>Search</button>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Category</th>
                    <th>Rack</th>
                    <th>Copies</th>
                    <th>Available</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{b.author} · {b.isbn || 'no ISBN'}</div>
                      </td>
                      <td><span className="badge indigo">{b.category}</span></td>
                      <td className="mono">{b.rack || '—'}</td>
                      <td>{b.copies}</td>
                      <td>
                        <span className={`badge ${b.available > 0 ? 'green' : 'red'}`}>{b.available} available</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEditBook(b)}><Pencil size={13} /></button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => removeBook(b)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {books.length === 0 && (
                    <tr><td colSpan={6}><div className="empty"><p>No books found.</p></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'issues' && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Student</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Fine</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{i.book?.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{i.book?.author}</div>
                    </td>
                    <td>{i.student?.name}</td>
                    <td style={{ fontSize: 12.5 }}>{fmtDate(i.issueDate)}</td>
                    <td style={{ fontSize: 12.5 }}>{fmtDate(i.dueDate)}</td>
                    <td>
                      <span className={`badge ${i.status === 'Returned' ? 'green' : isOverdue(i) ? 'red' : 'sky'}`}>
                        {isOverdue(i) ? 'Overdue' : i.status}
                      </span>
                    </td>
                    <td className="mono">{i.fine ? formatINR(i.fine) : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {i.status !== 'Returned' && (
                          <button className="btn btn-primary btn-sm" onClick={() => setReturnModal(i)}>
                            <RotateCcw size={13} /> Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {issues.length === 0 && (
                  <tr><td colSpan={7}><div className="empty"><p>No issues recorded.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal === 'book' && (
        <Modal
          title={form._id ? 'Edit book' : 'Add a book'}
          onClose={() => setModal(null)}
          width={520}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveBook} disabled={saving}>
                {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : null}
                Save book
              </button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <div className="rows-gap">
            <div className="field"><label>Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid-2">
              <div className="field"><label>Author</label><input className="input" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
              <div className="field"><label>ISBN</label><input className="input" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} /></div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Category</label>
                <input className="input" value={form.category} list="book-cats" onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <datalist id="book-cats">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="field"><label>Publisher</label><input className="input" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} /></div>
            </div>
            <div className="grid-3">
              <div className="field"><label>Copies</label><input className="input" type="number" min={1} value={form.copies} onChange={(e) => setForm({ ...form, copies: e.target.value })} /></div>
              <div className="field"><label>Rack</label><input className="input" value={form.rack} onChange={(e) => setForm({ ...form, rack: e.target.value })} /></div>
              <div className="field"><label>Price (₹)</label><input className="input" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'issue' && (
        <Modal
          title="Issue a book"
          onClose={() => setModal(null)}
          width={480}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
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
              <label>Book</label>
              <select className="select" value={issueForm.bookId} onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}>
                <option value="">Select book</option>
                {books.filter((b) => b.available > 0).map((b) => (
                  <option key={b._id} value={b._id}>{b.title} ({b.available} left)</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Student</label>
              <select className="select" value={issueForm.studentId} onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.user?.name} — {s.class?.name} (Roll {s.rollNo})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Due in (days)</label>
              <input className="input" type="number" min={1} value={issueForm.dueDays} onChange={(e) => setIssueForm({ ...issueForm, dueDays: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}

      {returnModal && (
        <Modal
          title={`Return "${returnModal.book?.title}"`}
          onClose={() => setReturnModal(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setReturnModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => doReturn(returnModal._id, returnFine)}>
                Confirm return
              </button>
            </>
          }
        >
          <ReturnInfo issue={returnModal} />
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function ReturnInfo({ issue }) {
  const daysLate = Math.max(0, Math.ceil((new Date() - new Date(issue.dueDate)) / (24 * 60 * 60 * 1000)));
  const fine = daysLate * 5;
  return (
    <div className="rows-gap">
      <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>
        Due date was {fmtDate(issue.dueDate)}. {daysLate > 0 ? `Book is ${daysLate} day(s) late — fine of ₹5/day applies.` : 'Book returned on time — no fine.'}
      </p>
      <div className="kv"><span className="k">Late fine</span><span className="v">{formatINR(fine)}</span></div>
    </div>
  );
}