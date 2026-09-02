import { useEffect } from 'react';
import { useSetTopbar } from '../../context/TopbarContext';

const F = "'Inter', system-ui, sans-serif";

export default function InstagramPage() {
  const setTopbar = useSetTopbar();

  useEffect(() => {
    setTopbar({
      title:    'Instagram',
      subtitle: 'Publish and manage your Instagram content',
      actions:  null,
    });
  }, []);

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12, color: 'var(--color-text-muted)' }}>
      <div style={{ fontSize: 32 }}>📸</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text)' }}>Coming soon</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>
        Instagram integration is coming soon.
      </div>
    </div>
  );
}