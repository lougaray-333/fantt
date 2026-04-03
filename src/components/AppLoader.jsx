import { useState, useEffect } from 'react';
import FanttLogo from './FanttLogo';
import FantasyLogo from './FantasyLogo';

export default function AppLoader({ onComplete }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1500);
    const doneTimer = setTimeout(() => onComplete(), 2100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      style={{
        opacity: fading ? 0 : 1,
        transition: fading ? 'opacity 0.6s ease-out' : 'none',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          animation: 'fantt-loader-mark-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <FanttLogo size={52} color="#E52222" />
      </div>
      <div
        style={{
          animation: 'fantt-loader-text-in 0.6s ease-out 0.5s forwards',
          opacity: 0,
          marginTop: '20px',
        }}
      >
        <FantasyLogo height={16} color="rgba(255,255,255,0.5)" />
      </div>
    </div>
  );
}
