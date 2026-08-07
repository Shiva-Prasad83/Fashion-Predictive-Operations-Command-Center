import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import NotificationPanel from './NotificationPanel';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <div style={{ flex: 1, marginLeft: sidebarOpen ? 256 : 72, transition: 'margin-left .3s cubic-bezier(.4,0,.2,1)', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Navbar onNotificationsOpen={() => setNotifOpen(true)} />
        <main style={{ flex: 1, padding: '28px 28px', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
