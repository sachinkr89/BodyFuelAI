import { useLocation } from 'react-router-dom';
import { Menu, X, Bell } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getGreeting } from '../../utils/helpers';

interface NavbarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMenuClick: () => void;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/log': 'Food Log',
  '/chat': 'AI Coach',
  '/forecast': 'Forecast',
  '/settings': 'Settings',
};

export default function Navbar({ collapsed, mobileOpen, onMenuClick }: NavbarProps) {
  const location = useLocation();
  const { profile } = useAuthStore();

  const pageTitle = routeTitles[location.pathname] || 'BodyFuel AI';
  const greeting = getGreeting();
  const displayName = profile?.display_name?.split(' ')[0] || 'there';
  const bodyMode = profile?.body_mode || 'general';

  return (
    <header className={`navbar ${collapsed ? 'navbar-with-sidebar-collapsed' : 'navbar-with-sidebar'}`}>
      <div className="navbar-left">
        <button
          className="menu-btn"
          onClick={onMenuClick}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="navbar-title-group">
          <h1 className="navbar-title">{pageTitle}</h1>
          <p className="navbar-greeting">
            {greeting}, {displayName} 👋
          </p>
        </div>
      </div>

      <div className="navbar-right">
        <span className={`mode-badge ${bodyMode}`}>
          {bodyMode === 'gym' ? '🏋️ Gym' : '🌿 General'}
        </span>
        <button className="navbar-icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>
      </div>
    </header>
  );
}
