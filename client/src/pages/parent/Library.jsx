import { useEffect, useState } from 'react';
import api from '../../api.js';
import ChildSelect from '../../components/ChildSelect.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fmtDate, formatINR } from '../../components/format.js';
import { Library, BookOpenCheck, AlertTriangle, RotateCcw } from 'lucide-react';

export default function ParentLibrary() {
  const [studentId, setStudentId] = useState('');
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    api
      .get(`/library/child/${studentId}`)
      .then((r) => {
        setIssues(r.data);
        api
          .get('/library/books', { params: { q: '' } })
          .then((b) => setBooks(b.data))
          .catch(() => {});
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, [studentId]);

  const dueSoon = issues.filter((i) => i.status === 'Issued' && i.dueDate && new Date(i.dueDate) >= new Date() && new Date(i.dueDate) - new Date() < 3 * 24 * 60 * 60 * 1000);
  const overdue = issues.filter((i) => i.status === 'Issued' && i.dueDate && new Date(i.dueDate) < new Date());

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Library</h1>
          <p>Books issued to your child and the school catalogue.</p>
        </div>
        <ChildSelect onChange={setStudentId} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!studentId && (
        <div className="card"><div className="empty"><p>No children linked to this account.</p></div></div>
      )}

      {studentId && (
        <>
          <div className="grid-stats">
            <StatCard icon={BookOpenCheck} tone="indigo" value={issues.filter((i) => i.status === 'Issued').length} label="Books with child" sub="Currently issued" />
            <StatCard icon={AlertTriangle} tone="red" value={overdue.length} label="Overdue" sub="Return immediately" />
            <StatCard icon={RotateCcw} tone="green" value={issues.filter((i) => i.status === 'Returned').length} label="Returned" sub="History" />
          </div>

          <div className="card">
            <div className="card-pad">
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Issued books</h2>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Author</th>
                      <th>Issued</th>
                      <th>Due</th>
                      <th>Status</th>
                      <th>Fine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((i) => (
                      <tr key={i._id}>
                        <td style={{ fontWeight: 600 }}>{i.book?.title}</td>
                        <td style={{ fontSize: 12.5 }}>{i.book?.author || '—'}</td>
                        <td style={{ fontSize: 12.5 }}>{fmtDate(i.issueDate)}</td>
                        <td style={{ fontSize: 12.5 }}>{fmtDate(i.dueDate)}</td>
                        <td>
                          <span className={`badge ${i.status === 'Issued' ? (i.dueDate && new Date(i.dueDate) < new Date() ? 'red' : 'amber') : 'green'}`}>
                            {i.status === 'Issued' && i.dueDate && new Date(i.dueDate) < new Date() ? 'Overdue' : i.status}
                          </span>
                        </td>
                        <td className="mono" style={{ fontSize: 12.5 }}>{i.fine > 0 ? formatINR(i.fine) : '—'}</td>
                      </tr>
                    ))}
                    {issues.length === 0 && (
                      <tr>
                        <td colSpan={6}><div className="empty"><p>No books issued to your child.</p></div></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-pad">
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>School catalogue</h2>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>ISBN</th>
                      <th>Category</th>
                      <th>Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((b) => (
                      <tr key={b._id}>
                        <td style={{ fontWeight: 600 }}>{b.title}</td>
                        <td style={{ fontSize: 12.5 }}>{b.author || '—'}</td>
                        <td className="mono" style={{ fontSize: 12.5 }}>{b.isbn || '—'}</td>
                        <td><span className="badge indigo">{b.category}</span></td>
                        <td>
                          <span className={`badge ${b.availableCount > 0 ? 'green' : 'red'}`}>
                            {b.availableCount > 0 ? `${b.availableCount} available` : 'Out of stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {books.length === 0 && (
                      <tr>
                        <td colSpan={5}><div className="empty"><p>No books in the catalogue yet.</p></div></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}