import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { BookOpenCheck, ShieldCheck } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Principal', email: 'principal@school.com' },
  { label: 'Teacher', email: 't1@school.com' },
  { label: 'Student', email: 's1@school.com' },
  { label: 'Parent', email: 'p1@school.com' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in. Is the server running?');
    } finally {
      setBusy(false);
    }
  };

  const useDemo = (acc) => {
    setEmail(acc.email);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="login-wrap">
      <div className="login-panel">
        <div className="login-brand">
          <div className="brand-mark">A</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>Athena International School</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Est. 1998
            </div>
          </div>
        </div>

        <div>
          <h2>One system for the whole school.</h2>
          <p className="lead">
            The principal plans the schedule, teachers take attendance, students follow their timetable —
            and parents stay informed. Everything in one calm, clean place.
          </p>
          <div className="login-quote" style={{ marginTop: 34 }}>
            “Education is the most powerful weapon which you can use to change the world.”
            <span>— Nelson Mandela</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 28, color: 'rgba(255,255,255,0.7)', fontSize: 12.5, fontWeight: 500 }}>
          <span>18 classes</span>
          <span>40+ teachers</span>
          <span>600 students</span>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-card">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to continue to your dashboard.</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label>Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} disabled={busy}>
              {busy ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} /> : <ShieldCheck />}
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="demo-box">
            <div className="demo-title">Demo accounts — tap to autofill</div>
            {DEMO_ACCOUNTS.map((acc) => (
              <div className="demo-account" key={acc.label} onClick={() => useDemo(acc)}>
                <b>
                  <BookOpenCheck size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                  {acc.label}
                </b>
                <span>{acc.email}</span>
              </div>
            ))}
            <div className="demo-account" style={{ color: 'var(--text-faint)', fontSize: 11.5, paddingLeft: 9 }}>
              All accounts use the password <b className="mono">password123</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
