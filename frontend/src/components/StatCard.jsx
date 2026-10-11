export default function StatCard({ label, value, icon: Icon, color = 'blue' }) {
  return (
    <div className="card-box stat-card">
      <div className={`stat-icon ${color}`}><Icon size={26} /></div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
