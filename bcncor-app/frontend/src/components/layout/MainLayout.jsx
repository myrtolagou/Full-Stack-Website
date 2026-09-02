import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { TopbarContext } from '../../context/TopbarContext';

export default function MainLayout() {
  const [bar, setBar] = useState({ title: '', subtitle: null, actions: null });

  return (
    <TopbarContext.Provider value={setBar}>
      <div style={{
        display: 'flex',
        height: '100vh',
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
      }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar title={bar.title} subtitle={bar.subtitle} actions={bar.actions} />
          <main style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--color-bg, #F8F9FA)',
            padding: '18px 20px',
          }}>
            <Outlet />
          </main>
        </div>
      </div>
    </TopbarContext.Provider>
  );
}
