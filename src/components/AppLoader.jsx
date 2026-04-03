import { useState, useEffect } from 'react';
import FanttLogo from './FanttLogo';

// FANTASY wordmark paths only (no shield), viewBox trimmed to text bounds
function FantasyWordmark({ height = 28, color = 'rgba(255,255,255,0.7)' }) {
  const width = Math.round(height * (383 / 35));
  return (
    <svg width={width} height={height} viewBox="186 48 383 35" fill="none">
      <path
        d="M218.375,48 L216.1,53.95 L196.15,53.95 C193.830404,53.95 191.95,55.830404 191.95,58.15 L191.95,63.4 L209.45,63.4 L207.175,69.35 L191.95,69.35 L191.95,83 L186,83 L186,57.1 C186,52.0742088 190.074209,48 195.1,48 L218.375,48 Z M241.475,83 L254.775,48 L260.725,48 L274.025,83 L268.075,83 L257.75,53.95 L247.425,83 L241.475,83 Z M418.575,83 L433.1,48 L436.6,48 L451.125,83 L447.625,83 L434.85,51.5 L422.075,83 L418.575,83 Z M305.35,83 L305.35,48 L312,48 L330.025,77.575 L330.025,48 L334.4,48 L334.4,83 L327.75,83 L309.725,53.425 L309.725,83 L305.35,83 Z M363.625,48 L396.175,48 L394.6875,51.85 L381.65,51.85 L381.65,83 L377.8,83 L377.8,51.85 L365.1125,51.85 L363.625,48 Z M509.925,48 L508.98,50.45 L488.1375,50.45 C484.126531,50.45 480.875,53.701532 480.875,57.7125 C480.875,61.723468 484.126532,64.275 488.1375,64.275 L501.6125,64.275 C506.589966,64.275 510.625,69.0100336 510.625,73.9875 C510.625,78.9649664 506.589966,83 501.6125,83 L479.16,83 L480.0525,80.55 L501.6125,80.55 C505.236869,80.55 508.175,77.6118687 508.175,73.9875 C508.175,70.3631314 505.236869,66.725 501.6125,66.725 L488.1375,66.725 C482.773435,66.725 478.425,63.0765656 478.425,57.7125 C478.425,52.3484344 482.773435,48 488.1375,48 L509.925,48 Z M538.275,48 L552.45,66.025 L566.625,48 L568.9,48 L553.325,67.6 L553.325,83 L551.575,83 L551.575,67.6 L536,48 L538.275,48 Z"
        fill={color}
        fillRule="nonzero"
      />
    </svg>
  );
}

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
        className="mt-5"
        style={{
          animation: 'fantt-wordmark-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards',
          opacity: 0,
        }}
      >
        <FantasyWordmark height={22} color="rgba(255,255,255,0.6)" />
      </div>
    </div>
  );
}
