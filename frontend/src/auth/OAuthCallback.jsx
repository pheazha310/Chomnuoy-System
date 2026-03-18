import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const payload = params.get('payload');
    const redirectTo = getSafeRedirect(location.search);

    if (error) {
      setMessage(error);
      return;
    }

    if (!payload) {
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
      setMessage('Unable to process login payload.');
    }
  }, [location.search, navigate]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      {message}
    </div>
  );
}
