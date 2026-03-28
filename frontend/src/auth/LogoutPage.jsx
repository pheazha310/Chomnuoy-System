import { useCallback, useEffect, useMemo, useState } from 'react';
import { Home, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearAuthState, getAuthToken, getSession } from '@/services/session-service.js';

const LOGOUT_REDIRECT_SECONDS = 30;

export default function LogoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [secondsLeft, setSecondsLeft] = useState(LOGOUT_REDIRECT_SECONDS);
  const from = new URLSearchParams(location.search).get('from');
  const hadSession = useMemo(() => {
    const hasDonorSession = Boolean(getSession());
    const hasApiToken = Boolean(getAuthToken());
    return hasDonorSession || hasApiToken;
  }, []);

  const handleLogoutNow = useCallback(() => {
    clearAuthState();
    if (from && from.startsWith('/') && !from.startsWith('/logout')) {
      navigate(from, { replace: true });
      return;
    }
    navigate('/campaigns', { replace: true });
  }, [from, navigate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      handleLogoutNow();
    }, LOGOUT_REDIRECT_SECONDS * 1000);
    const intervalId = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [handleLogoutNow]);

  const handleCancel = () => {
    if (from && from.startsWith('/') && !from.startsWith('/logout')) {
      navigate(from, { replace: true });
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/campaigns/donor', { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[380px] w-full max-w-md items-center justify-center">
      <div className="w-full rounded-3xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF2FF] text-[#1D6FE8]">
          <LogOut className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          {hadSession ? 'Signing you out' : 'You are already signed out'}
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          You will be logged out in {secondsLeft}s if no action is taken.
        </p>
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
          <div
            className="h-full rounded-full bg-[#2563EB] transition-all duration-300"
            style={{ width: `${((LOGOUT_REDIRECT_SECONDS - secondsLeft) / LOGOUT_REDIRECT_SECONDS) * 100}%` }}
          />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleLogoutNow}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-6 text-[0.98rem] font-semibold tracking-[0.01em] text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(37,99,235,0.46)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] focus-visible:ring-offset-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#CBD5E1] bg-white px-6 text-[0.98rem] font-semibold tracking-[0.01em] text-[#334155] shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#94A3B8] hover:bg-[#F8FAFC] hover:shadow-[0_8px_18px_rgba(15,23,42,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CBD5E1] focus-visible:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            <span className="whitespace-nowrap">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
