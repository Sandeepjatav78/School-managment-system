import { useAuth } from '../context/AuthContext.jsx';
import { Mail, BadgeCheck, CreditCard, UserRound, Phone, Building2 } from 'lucide-react';

const ROLE_COLOR = { principal: 'indigo', teacher: 'sky', student: 'green', parent: 'amber' };

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  const role = user.role;
  const profile = user.profile;

  const rows = [
    { icon: Mail, label: 'Email', value: user.email },
    { icon: UserRound, label: 'Name', value: user.name },
  ];

  if (profile) {
    if (role === 'teacher') {
      rows.push(
        { icon: CreditCard, label: 'Employee ID', value: profile.employeeId },
        { icon: Phone, label: 'Phone', value: profile.phone || '—' },
        { icon: BadgeCheck, label: 'Qualification', value: profile.qualification || '—' },
        { icon: Building2, label: 'Subjects', value: profile.subjects?.map((s) => s.name).join(', ') || '—' },
        {
          icon: Building2,
          label: 'Joined',
          value: profile.joinDate
            ? new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : '—',
        }
      );
    } else if (role === 'student') {
      rows.push(
        { icon: CreditCard, label: 'Admission No.', value: profile.admissionNo },
        { icon: BadgeCheck, label: 'Roll No.', value: profile.rollNo ?? '—' },
        { icon: Building2, label: 'Class', value: profile.class?.name || '—' },
        { icon: Phone, label: 'Phone', value: profile.phone || '—' },
        { icon: Mail, label: 'Parent', value: profile.parent?.name || '—' }
      );
    } else if (role === 'parent') {
      rows.push({
        icon: UserRound,
        label: 'Children at school',
        value: user.children?.map((c) => `${c.user.name} — ${c.class?.name || ''}`).join(' · ') || '—',
      });
    }
  }

  return (
    <>
      <div className="card" style={{ padding: 30, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className="avatar" style={{ width: 68, height: 68, fontSize: 24 }}>
            {user.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{user.name}</div>
            <div style={{ marginTop: 6 }}>
              <span className={`role-badge ${ROLE_COLOR[role]}`} style={{ fontSize: 12, padding: '5px 12px' }}>
                {role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-pad">
          <div className="card-title">Account details</div>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <td style={{ width: 240, color: 'var(--text-faint)', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                        <r.icon size={14} />
                        {r.label}
                      </span>
                    </td>
                    <td className="cell-main">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
