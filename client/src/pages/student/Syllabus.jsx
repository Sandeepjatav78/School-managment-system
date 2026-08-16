import { useEffect, useState } from 'react';
import api from '../../api.js';
import StatCard from '../../components/StatCard.jsx';
import { BookMarked, CheckCircle2, PlayCircle, CircleDashed } from 'lucide-react';

const STATUS_ICON = { Completed: CheckCircle2, Ongoing: PlayCircle, Planned: CircleDashed };

export default function Syllabus() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/syllabus')
      .then((r) => setItems(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const progress = (chapters) => {
    const done = chapters.filter((c) => c.status === 'Completed').length;
    return chapters.length ? Math.round((done / chapters.length) * 100) : 0;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Syllabus</h1>
          <p>What you will study this year — chapter by chapter.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-stats">
        <StatCard icon={BookMarked} tone="indigo" value={items.length} label="Subjects planned" sub="Your class syllabus" />
        <StatCard
          icon={CheckCircle2}
          tone="green"
          value={items.reduce((s, i) => s + i.chapters.filter((c) => c.status === 'Completed').length, 0)}
          label="Chapters completed"
          sub="Covered in class"
        />
        <StatCard
          icon={PlayCircle}
          tone="amber"
          value={items.reduce((s, i) => s + i.chapters.filter((c) => c.status === 'Ongoing').length, 0)}
          label="In progress"
          sub="Currently being taught"
        />
      </div>

      <div className="grid-2">
        {items.map((item) => {
          const pct = progress(item.chapters);
          return (
            <div className="card" key={item._id}>
              <div className="card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div className="stat-icon indigo"><BookMarked /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{item.subject?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{item.teacher?.user?.name || '—'} · {item.class?.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{pct}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>completed</div>
                  </div>
                </div>
                <div style={{ height: 6, background: '#eef0f6', borderRadius: 99, marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: 99 }} />
                </div>
                <div className="rows-gap">
                  {item.chapters.map((ch) => {
                    const Icon = STATUS_ICON[ch.status];
                    return (
                      <div key={ch._id} className="list-card" style={{ padding: '8px 2px' }}>
                        <Icon size={15} color={ch.status === 'Completed' ? 'var(--green)' : ch.status === 'Ongoing' ? 'var(--amber)' : 'var(--text-faint)'} />
                        <div className="grow">
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{ch.title}</div>
                          {ch.week && <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{ch.week}</div>}
                        </div>
                        <span className={`badge ${ch.status === 'Completed' ? 'green' : ch.status === 'Ongoing' ? 'amber' : 'gray'}`}>{ch.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="card"><div className="empty"><p>No syllabus published for your class yet.</p></div></div>
        )}
      </div>
    </>
  );
}