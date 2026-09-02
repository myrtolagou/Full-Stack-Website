import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title, subtitle, actions }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{
      height: 50,
      background: '#fff',
      borderBottom: '0.5px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
        {title && (
          <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A', lineHeight: 1 }}>{title}</div>
        )}
        {subtitle && (
          <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1 }}>{subtitle}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {actions}
        <button
          onClick={handleLogout}
          onMouseEnter={e => { e.currentTarget.style.background = '#F5F7FA'; e.currentTarget.style.color = '#1A1A1A'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#7A8FA0'; }}
          style={{
            padding: '0 12px', height: 30,
            border: '0.5px solid #DDE5ED', borderRadius: 6,
            background: '#fff', color: '#7A8FA0',
            fontSize: 12, cursor: 'pointer',
            fontFamily: "'Inter', system-ui, sans-serif",
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}