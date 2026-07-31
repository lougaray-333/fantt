import { useEffect, useState } from 'react';

export default function BoxCallback() {
  const [status, setStatus] = useState('Connecting to Box…');

  useEffect(() => {
    const params        = new URLSearchParams(window.location.search);
    const code          = params.get('code');
    const state         = params.get('state');
    const storedState   = sessionStorage.getItem('box_oauth_state');
    const returnUrl     = sessionStorage.getItem('box_return_url') || '/';

    const fail = (msg) => {
      setStatus(msg);
      setTimeout(() => { window.location.href = '/'; }, 2500);
    };

    if (!code)              return fail('Connection cancelled.');
    if (state !== storedState) return fail('Security check failed. Please try again.');

    sessionStorage.removeItem('box_oauth_state');
    sessionStorage.removeItem('box_return_url');

    fetch('/api/box-token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:       'exchange',
        code,
        redirect_uri: `${window.location.origin}/box-callback`,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.access_token) {
          localStorage.setItem('box_access_token', data.access_token);
          localStorage.setItem('box_refresh_token', data.refresh_token);
          localStorage.setItem('box_token_expiry',  Date.now() + (data.expires_in - 60) * 1000);
          setStatus('Box connected! Taking you back…');
          setTimeout(() => { window.location.href = returnUrl; }, 1000);
        } else {
          fail('Connection failed. Please try again.');
        }
      })
      .catch(() => fail('Connection failed. Please try again.'));
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a0a0a',
      fontFamily: "'Inter', sans-serif", color: '#fff',
    }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 129 130" fill="none" style={{ marginBottom: 20 }}>
          <path d="M128.992248 24.2154558c0-7.837565-5.278685-17.83768403-17.043423-22.47559798-15.2381769-6.00684349-21.1734328 12.15235358-47.452701 12.15235358s-32.214524-18.15919707-47.4527007-12.15235358c-11.76473803 4.63791395-17.0434233 14.63803298-17.0434233 22.47559798 0 10.2510088 12.8466605 17.4455479 12.8466605 40.8021625 0 23.3569371-12.8466605 30.5514761-12.8466605 40.8024847 0 7.837565 5.27868527 17.838007 17.0434233 22.475598 15.2381767 6.006521 21.1734325-12.152353 47.4527007-12.152353s32.2145241 18.158874 47.452701 12.152353c11.764738-4.637591 17.043423-14.638033 17.043423-22.475598 0-10.2510086-12.84666-17.4455476-12.84666-40.8024847 0-23.3566146 12.84666-30.5511537 12.84666-40.8021625" fill="#E52222"/>
        </svg>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 0 }}>{status}</p>
      </div>
    </div>
  );
}
