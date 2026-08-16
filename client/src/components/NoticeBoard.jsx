import { Megaphone } from 'lucide-react';

const AUDIENCE_LABEL = {
  all: 'Everyone',
  students: 'Students',
  teachers: 'Teachers',
  parents: 'Parents',
  class: 'Class',
};

export default function NoticeBoard({ notices = [] }) {
  if (notices.length === 0) {
    return (
      <div className="empty">
        <Megaphone />
        <p>No notices yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {notices.map((n) => (
        <div className="card" key={n._id}>
          <div className="card-pad">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
              <div className="stat-icon indigo" style={{ width: 38, height: 38 }}>
                <Megaphone />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14.5 }}>{n.title}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                  <span className="badge gray">
                    {new Date(n.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className={`badge ${n.audience === 'class' ? 'amber' : 'indigo'}`}>
                    For {AUDIENCE_LABEL[n.audience]}
                    {n.audience === 'class' && n.targetClass ? ` — ${n.targetClass.name}` : ''}
                  </span>
                </div>
                <p style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-soft)', whiteSpace: 'pre-wrap' }}>
                  {n.body}
                </p>
                <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--text-faint)' }}>
                  Published by {n.publishedBy?.name || 'the principal'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
