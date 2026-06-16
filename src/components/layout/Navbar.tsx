import { useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getGreeting } from '../../utils/helpers';

interface NavbarProps {
  onMenuClick: () => void;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/log': 'Food Log',
  '/forecast': 'Forecast',
  '/settings': 'Settings',
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();
  const { profile } = useAuthStore();

  const pageTitle = routeTitles[location.pathname] || 'BodyFuel AI';
  const greeting = getGreeting();
  const displayName = profile?.display_name?.split(' ')[0] || 'there';
  const bodyMode = profile?.body_mode || 'general';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={22} />
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
