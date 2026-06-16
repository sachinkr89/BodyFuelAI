import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './Layout.css';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="main-area">
        <Navbar collapsed={sidebarCollapsed} onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className={`main-content ${sidebarCollapsed ? 'main-content-collapsed' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
