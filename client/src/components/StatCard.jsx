export default function StatCard({ icon: Icon, tone, value, label, sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone || 'indigo'}`}>
        <Icon />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-label" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}
