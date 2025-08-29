export default function Topbar({ title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#111827', color: '#fff', borderRadius: 8 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <div>{right}</div>
    </div>
  );
}
