export default function NavItem({ label }) {
  return (
    <div style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
      {label}
    </div>
  );
}
