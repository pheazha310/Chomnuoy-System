import { Link, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function getSafeRedirect(search) {
  const redirectParam = new URLSearchParams(search).get('redirect');
  if (!redirectParam || !redirectParam.startsWith('/')) {
    return '/profile';
  }
  return redirectParam;
}

export default function OAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing login...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const payload = params.get('payload');
    const redirectTo = getSafeRedirect(location.search);

    if (error) {
      setIsError(true);
      setMessage(error);
      return;
    }

    if (!payload) {
      setIsError(true);
      setMessage('Missing login payload.');
      return;
    }

    try {
      const decoded = JSON.parse(atob(payload));
      const accountTypeRaw = decoded?.account_type ?? decoded?.accountType ?? 'Donor';
      const accountType = String(accountTypeRaw || 'Donor');
      const user = decoded?.user || {};
      const sessionData = {
        isLoggedIn: true,
        role: accountType,
        name: user.name || 'User',
        email: user.email || '',
        impactLevel: accountType === 'Admin' ? 'Admin' : (accountType === 'Organization' ? 'Organization' : 'Gold'),
        avatar: user.avatar || '',
        userId: user.id || null,
        accountType,
        logoutRedirectTo: redirectTo,
      };

      window.localStorage.setItem('chomnuoy_session', JSON.stringify(sessionData));
      window.dispatchEvent(new Event('chomnuoy-session-updated'));
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setIsError(true);
      setMessage('Unable to process login payload.');
    }
  }, [location.search, navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        background: 'linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          width: 'min(560px, 100%)',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)',
          border: `1px solid ${isError ? '#fecaca' : '#dbeafe'}`,
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '999px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: '1rem',
            background: isError ? '#fef2f2' : '#eff6ff',
            color: isError ? '#b91c1c' : '#1d4ed8',
          }}
        >
          {isError ? '!' : '...'}
        </div>
        <h1
          style={{
            margin: '0 0 0.75rem',
            fontSize: '1.75rem',
            color: '#0f172a',
          }}
        >
          {isError ? 'Social login unavailable' : 'Completing sign in'}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: '1rem',
            lineHeight: 1.6,
            color: '#475569',
          }}
        >
          {message}
        </p>
        {isError ? (
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.8rem 1.2rem',
                borderRadius: '999px',
                background: '#2563eb',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Back to Login
            </Link>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.8rem 1.2rem',
                borderRadius: '999px',
                border: '1px solid #cbd5e1',
                color: '#334155',
                textDecoration: 'none',
                fontWeight: 600,
                background: '#ffffff',
              }}
            >
              Go Home
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
