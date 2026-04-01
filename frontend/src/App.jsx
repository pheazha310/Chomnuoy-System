import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ROUTES from '@/constants/routes.js';
import Navbar from '@/components/Navbar.jsx';
import Footer from '@/components/Footer.jsx';
import AuthLayout from '@/auth/AuthLayout.jsx';
import OAuthCallback from '@/auth/OAuthCallback.jsx';
import { useAdminAutoTranslate } from '@/i18n/adminAutoTranslate.js';
import { OrganizationSettingsProvider } from '@/contexts/OrganizationSettingsContext';
import { findUserByEmail } from '@/services/user-service.js';
import { getAuthToken, getSession, isDonorSession, setAuthToken, setSession } from '@/services/session-service.js';

const Home = lazy(() => import('@/app/home/page.jsx'));
const AfterLoginHome = lazy(() => import('@/app/home/AfterLoginHome.jsx'));
const CampaignsPage = lazy(() => import('@/components/pages/CampaignsPage.jsx'));
const CampaignDetailPage = lazy(() => import('@/components/pages/CampaignDetailPage.jsx'));
const HowItWorksPage = lazy(() => import('@/components/pages/HowItWorksPage.jsx'));
const OrganizationBeforeLogin = lazy(() => import('@/components/pages/OrganizationBeforeLogin.jsx'));
const OrganizationAfterLogin = lazy(() => import('@/components/pages/OrganizationAfterLogin.jsx'));
const AboutPage = lazy(() => import('@/components/pages/AboutPage.jsx'));
const ContactPage = lazy(() => import('@/components/pages/ContactPage.jsx'));
const MyProfilePage = lazy(() => import('@/components/pages/MyProfilePage.jsx'));
const LoginPage = lazy(() => import('@/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('@/auth/RegisterPage.jsx'));
const DonorCampaignsPage = lazy(() => import('@/app/compaigns/compaignDetailAter.jsx'));
const MyDonation = lazy(() => import('@/app/donate/myDonation.jsx'));
const ViewDetail = lazy(() => import('@/app/donate/viewDetail.jsx'));
const DonationThankYouPage = lazy(() => import('@/app/donate/thankYou.jsx'));
const AccountSettings = lazy(() => import('@/app/setting/AccountSettings.jsx'));
const OrganizationDashboardPage = lazy(() => import('@/app/organization/page.jsx'));
const OrganizationReports = lazy(() => import('@/app/organization/OrganizationReports.jsx'));
const OrganizationDonationsPage = lazy(() => import('@/app/organization/donations.jsx'));
const OrganizationCampaignsPage = lazy(() => import('@/app/organization/OrganizationCampaignsPage.jsx'));
const OrganizationCampaignCreatePage = lazy(() => import('@/app/organization/OrganizationCampaignCreatePage.jsx'));
const OrganizationCampaignDetailPage = lazy(() => import('@/app/organization/OrganizationCampaignDetailPage.jsx'));
const OrganizationProfilePage = lazy(() => import('@/app/organization/profile.jsx'));
const OrganizationProfileEditPage = lazy(() => import('@/app/organization/profile-edit.jsx'));
const OrganizationSettings = lazy(() => import('@/app/organization/OrganizationSettings.jsx'));
const MaterialPickupPage = lazy(() => import('@/app/material-pickup.jsx/materialPickup.jsx'));
const PickupViewDetailPage = lazy(() => import('@/app/material-pickup.jsx/pickupViewDetail.jsx'));
const PickupReschedulePage = lazy(() => import('@/app/material-pickup.jsx/pickupReschedule.jsx'));
const AdminPage = lazy(() => import('@/app/admin/page.jsx'));
const UserDashboard = lazy(() => import('@/app/admin/userDashboard.jsx'));
const AdminUserProfilePage = lazy(() => import('@/app/admin/userProfile.jsx'));
const AdminProfilePage = lazy(() => import('@/app/admin/profile.jsx'));
const AdminSettingsPage = lazy(() => import('@/app/admin/AdminSettingsPage.jsx'));
const OrganizationDashboard = lazy(() => import('@/app/admin/organizationDashboard.jsx'));
const AdminOrganizationProfilePage = lazy(() => import('@/app/admin/organizationProfile.jsx'));
const MaterialPickupAdminPage = lazy(() => import('@/app/admin/materialPickupAdmin.jsx'));
const AdminNotificationPage = lazy(() => import('@/app/admin/notification.jsx'));
const DonationAdminPage = lazy(() => import('@/app/admin/donaionAdmin.jsx'));
const TransactionAdminPage = lazy(() => import('@/app/admin/transactionAdmin.jsx'));
const ReportsAdmin = lazy(() => import('@/components/pages/reports/ReportsAdmin.jsx'));

const DEFAULT_AVATAR_URL =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80';
const PROFILE_AVATAR_OVERRIDES_KEY = 'chomnuoy_profile_avatar_overrides';
const LAST_SEEN_PING_MIN_INTERVAL_MS = 4 * 60 * 1000;
const LAST_SEEN_CACHE_PREFIX = 'chomnuoy:last-seen';

function PageLoader() {
  useEffect(() => {
    const bar = document.getElementById('nprogress-bar');
    if (!bar) return;
    bar.style.width = '30%';
    const t1 = setTimeout(() => { bar.style.width = '70%'; }, 150);
    const t2 = setTimeout(() => { bar.style.width = '90%'; }, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      bar.style.width = '100%';
      setTimeout(() => { bar.style.width = '0%'; }, 300);
    };
  }, []);

  return (
    <div className="page-skeleton">
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="skeleton-pulse" style={{ height: 18, width: '60%' }} />
        <div className="skeleton-pulse" style={{ height: 14, width: '100%' }} />
        <div className="skeleton-pulse" style={{ height: 14, width: '80%' }} />
      </div>
    </div>
  );
}

function getSafeRedirect(search) {
  const redirectParam = new URLSearchParams(search).get('redirect');
  if (!redirectParam || !redirectParam.startsWith('/')) {
    return ROUTES.HOME;
  }
  return redirectParam;
}

function getStorageFileUrl(path) {
  if (!path) return '';
  const rawPath = String(path).trim();
  if (
    rawPath.startsWith('http://') ||
    rawPath.startsWith('https://') ||
    rawPath.startsWith('blob:') ||
    rawPath.startsWith('data:')
  ) {
    return rawPath;
  }

  const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const appBase = apiBase.replace(/\/api\/?$/, '');
  if (normalizedPath.startsWith('uploads/') || normalizedPath.startsWith('storage/')) {
    return `${appBase}/${normalizedPath}`;
  }
  if (normalizedPath.startsWith('campaigns/') || normalizedPath.startsWith('avatars/')) {
    return `${appBase}/storage/${normalizedPath}`;
  }
  if (normalizedPath.startsWith('files/')) {
    return `${apiBase}/${normalizedPath}`;
  }
  return `${apiBase}/files/${normalizedPath}`;
}

function getProfileAvatarOverrides() {
  try {
    const raw = window.localStorage.getItem(PROFILE_AVATAR_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function resolveAvatar(profile) {
  return (
    profile?.avatar ||
    profile?.avatar_url ||
    getStorageFileUrl(profile?.avatar_path || profile?.profile_image || profile?.image_url) ||
    profile?.profile_image ||
    profile?.image_url ||
    ''
  );
}

function buildAvatarOverrideKey(role, profile, fallbackEmail = '') {
  const normalizedRole = String(role || 'Donor').toLowerCase();
  const email = String(profile?.email || fallbackEmail || '').trim().toLowerCase();
  const identity = profile?.id ? `id:${profile.id}` : (email ? `email:${email}` : 'anonymous');
  return `${normalizedRole}:${identity}`;
}

function normalizeAccountId(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (!/^\d+$/.test(String(value))) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function getLastSeenKey(suffix) {
  return `${LAST_SEEN_CACHE_PREFIX}:${suffix}`;
}

function shouldSkipLastSeenPing(userId) {
  try {
    const disabledUntil = Number(window.sessionStorage.getItem(getLastSeenKey(`disabled:${userId}`)) || 0);
    if (disabledUntil > Date.now()) {
      return true;
    }

    const lastPingAt = Number(window.sessionStorage.getItem(getLastSeenKey(`sent:${userId}`)) || 0);
    return Date.now() - lastPingAt < LAST_SEEN_PING_MIN_INTERVAL_MS;
  } catch {
    return false;
  }
}

function markLastSeenPingSent(userId) {
  try {
    window.sessionStorage.setItem(getLastSeenKey(`sent:${userId}`), String(Date.now()));
    window.sessionStorage.removeItem(getLastSeenKey(`disabled:${userId}`));
  } catch {
    // Ignore storage failures.
  }
}

function disableLastSeenPing(userId, ms = 30 * 60 * 1000) {
  try {
    window.sessionStorage.setItem(getLastSeenKey(`disabled:${userId}`), String(Date.now() + ms));
  } catch {
    // Ignore storage failures.
  }
}

function CampaignDetailRoute() {
  const { id, campaignSlug } = useParams();
  return <CampaignDetailPage campaignId={campaignSlug || id} />;
}

function RequireAuth({ children }) {
  const location = useLocation();
  const session = getSession();

  if (!session?.isLoggedIn) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}

function RequireOrganizationAuth({ children }) {
  const location = useLocation();
  const session = getSession();
  const roleValue = String(session?.role || session?.accountType || '').toLowerCase();
  const isOrganization = Boolean(session?.isLoggedIn && roleValue === 'organization');

  if (!isOrganization) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}

function RequireAdminAuth({ children }) {
  useAdminAutoTranslate();
  const location = useLocation();
  const session = getSession();
  const roleValue = String(session?.role || session?.accountType || '').toLowerCase();
  const isAdmin = Boolean(session?.isLoggedIn && roleValue === 'admin');

  if (!isAdmin) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}

function LoginRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const redirectTo = getSafeRedirect(location.search);
  const loginEmail = new URLSearchParams(location.search).get('email');

  const handleLoginSuccess = (data) => {
    const rawAccountType = data?.account_type ?? data?.accountType ?? data?.user?.role ?? '';
    const normalizedRaw = String(rawAccountType).toLowerCase();
    const normalizedAccountType = normalizedRaw === 'organization'
      ? 'Organization'
      : (normalizedRaw === 'admin' ? 'Admin' : 'Donor');
    const isOrganization = normalizedAccountType === 'Organization';
    const isAdmin = normalizedAccountType === 'Admin';
    const profile = isOrganization ? (data?.organization ?? data?.user) : (data?.user ?? data?.organization);

    if (!profile) {
      const user = data?.user || data || {};
      const avatarOverrideKey = isOrganization
        ? null
        : buildAvatarOverrideKey(normalizedAccountType, user, loginEmail || user.email);
      const avatarOverrides = getProfileAvatarOverrides();
      const resolvedAvatar = isOrganization
        ? DEFAULT_AVATAR_URL
        : (avatarOverrides[avatarOverrideKey] || resolveAvatar(user) || '');
      const sessionData = {
        isLoggedIn: true,
        role: normalizedAccountType,
        name: user.name || 'Donor User',
        email: user.email || loginEmail || '',
        impactLevel: isOrganization ? 'Organization' : (isAdmin ? 'Admin' : 'Gold'),
        avatar: resolvedAvatar,
        userId: normalizeAccountId(user.id),
        organizationId: isOrganization ? normalizeAccountId(user.id) : null,
        accountType: normalizedAccountType,
        logoutRedirectTo: redirectTo,
        avatarOverrideKey: avatarOverrideKey || undefined,
      };

      if (data?.token) {
        setAuthToken(data.token);
      }

      setSession(sessionData);
      if (isOrganization) {
        navigate(ROUTES.ORGANIZATION_DASHBOARD);
        return;
      }
      if (isAdmin) {
        navigate('/admin');
        return;
      }
      if (!redirectParam) {
        navigate('/profile');
        return;
      }
      navigate(redirectTo);
      return;
    }

    const avatarOverrideKey = isOrganization
      ? null
      : buildAvatarOverrideKey(normalizedAccountType, profile, loginEmail || profile?.email);
    const avatarOverrides = getProfileAvatarOverrides();
    const resolvedAvatar = isOrganization
      ? DEFAULT_AVATAR_URL
      : (avatarOverrides[avatarOverrideKey] || resolveAvatar(profile) || '');
    const sessionData = {
      isLoggedIn: true,
      role: isOrganization ? 'Organization' : (isAdmin ? 'Admin' : 'Donor'),
      name: profile?.name || 'User',
      email: profile?.email || loginEmail || '',
      impactLevel: isOrganization ? 'Organization' : (isAdmin ? 'Admin' : 'Gold'),
      avatar: resolvedAvatar,
      userId: normalizeAccountId(profile?.id),
      organizationId: isOrganization ? normalizeAccountId(profile?.id) : null,
      accountType: normalizedAccountType,
      logoutRedirectTo: redirectTo,
      avatarOverrideKey: avatarOverrideKey || undefined,
    };

    if (data?.token) {
      setAuthToken(data.token);
    }

    setSession(sessionData);
    if (isOrganization) {
      navigate(ROUTES.ORGANIZATION_DASHBOARD);
      return;
    }
    if (isAdmin) {
      navigate('/admin');
      return;
    }
    if (!redirectParam) {
      navigate('/profile');
      return;
    }
    navigate(redirectTo);
  };

  return (
    <AuthLayout mode="login">
      <LoginPage
        onToggleMode={() => navigate(`/register?redirect=${encodeURIComponent(redirectTo)}`)}
        onLoginSuccess={handleLoginSuccess}
      />
    </AuthLayout>
  );
}

function RegisterRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getSafeRedirect(location.search);

  return (
    <AuthLayout mode="register">
      <RegisterPage onToggleMode={() => navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`)} />
    </AuthLayout>
  );
}

function OrganizationRoute() {
  const session = getSession();
  return isDonorSession(session) ? <OrganizationAfterLogin /> : <OrganizationBeforeLogin />;
}

function HomeRoute() {
  const session = getSession();
  const isDonorLoggedIn = isDonorSession(session);

  if (isDonorLoggedIn) {
    return <AfterLoginHome />;
  }

  return <Home />;
}

function AfterLoginHomeRoute() {
  const session = getSession();
  const isDonorLoggedIn = isDonorSession(session);

  if (!isDonorLoggedIn) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <AfterLoginHome />;
}

export default function App() {
  const location = useLocation();
  const hideShell =
    location.pathname === ROUTES.LOGIN ||
    location.pathname === '/register' ||
    location.pathname === '/oauth/callback' ||
    location.pathname.startsWith('/organization/') ||
    location.pathname.startsWith('/admin');
  const session = getSession();
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!session?.isLoggedIn || !session?.userId) return;
    const roleValue = String(session?.role || session?.accountType || '').toLowerCase();
    if (roleValue === 'admin' || roleValue === 'organization') return;

    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const ping = async () => {
      if (shouldSkipLastSeenPing(session.userId)) return;

      try {
        const response = await fetch(`${apiBase}/users/${session.userId}/last-seen`, { method: 'POST', headers });
        if (response.ok) {
          markLastSeenPingSent(session.userId);
          return;
        }

        if (response.status === 404) {
          const matchedUser = session?.email ? await findUserByEmail(session.email).catch(() => null) : null;
          if (matchedUser?.id && matchedUser.id !== session.userId) {
            setSession({
              ...session,
              userId: normalizeAccountId(matchedUser.id),
              name: matchedUser.name || session.name,
              email: matchedUser.email || session.email,
            });
            return;
          }
          disableLastSeenPing(session.userId);
          return;
        }

        if (response.status === 429) {
          disableLastSeenPing(session.userId, 60 * 1000);
        }
      } catch {
        // Ignore transient network failures.
      }
    };

    ping();
    const intervalId = window.setInterval(ping, 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [apiBase, session?.isLoggedIn, session?.role, session?.accountType, session?.userId]);

  const appContent = (
    <>
      {!hideShell && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path={ROUTES.HOME} element={<HomeRoute />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/AfterLoginHome" element={<AfterLoginHomeRoute />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.ORGANIZATIONS} element={<OrganizationRoute />} />
          <Route path={ROUTES.ORGANIZATION_DONATE()} element={<OrganizationRoute />} />
          <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
          <Route path="/campaigns/donor" element={<DonorCampaignsPage />} />
          <Route path={ROUTES.CAMPAIGN_DETAILS()} element={<CampaignDetailRoute />} />
          <Route path="/campaigns/:campaignSlug" element={<CampaignDetailRoute />} />
          <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
          <Route path={ROUTES.CONTACT} element={<ContactPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
          <Route
            path={ROUTES.ORGANIZATION_DASHBOARD}
            element={(
              <RequireOrganizationAuth>
                <OrganizationSettingsProvider>
                  <OrganizationDashboardPage />
                </OrganizationSettingsProvider>
              </RequireOrganizationAuth>
            )}
          />
          <Route
            path={ROUTES.ORGANIZATION_REPORTS}
            element={(
              <RequireOrganizationAuth>
                <OrganizationSettingsProvider>
                  <OrganizationReports />
                </OrganizationSettingsProvider>
              </RequireOrganizationAuth>
            )}
          />
          <Route
            path="/organization/donations"
            element={(
              <RequireOrganizationAuth>
                <OrganizationSettingsProvider>
                  <OrganizationDonationsPage />
                </OrganizationSettingsProvider>
              </RequireOrganizationAuth>
            )}
          />
          <Route
            path={ROUTES.ORGANIZATION_CAMPAIGNS}
            element={(
              <RequireOrganizationAuth>
                <OrganizationSettingsProvider>
                  <OrganizationCampaignsPage />
                </OrganizationSettingsProvider>
              </RequireOrganizationAuth>
            )}
          />
          <Route
            path={ROUTES.ORGANIZATION_CAMPAIGN_CREATE}
            element={(
              <RequireOrganizationAuth>
                <OrganizationSettingsProvider>
                  <OrganizationCampaignCreatePage />
                </OrganizationSettingsProvider>
              </RequireOrganizationAuth>
            )}
          />
          <Route
            path={ROUTES.ORGANIZATION_CAMPAIGN_DETAIL()}
            element={(
              <RequireOrganizationAuth>
                <OrganizationSettingsProvider>
                  <OrganizationCampaignDetailPage />
                </OrganizationSettingsProvider>
              </RequireOrganizationAuth>
            )}
          />
          <Route
            path="/organization/profile"
            element={(
              <RequireOrganizationAuth>
                <OrganizationSettingsProvider>
                  <OrganizationProfilePage />
                </OrganizationSettingsProvider>
              </RequireOrganizationAuth>
            )}
          />
          <Route
            path="/organization/profile/edit"
            element={(
              <RequireOrganizationAuth>
                <OrganizationSettingsProvider>
                  <OrganizationProfileEditPage />
                </OrganizationSettingsProvider>
              </RequireOrganizationAuth>
            )}
          />
          <Route
            path="/organization/settings"
            element={(
              <RequireOrganizationAuth>
                <OrganizationSettingsProvider>
                  <OrganizationSettings />
                </OrganizationSettingsProvider>
              </RequireOrganizationAuth>
            )}
          />
          <Route
            path="/admin"
            element={(
              <RequireAdminAuth>
                <AdminPage />
              </RequireAdminAuth>
            )}
          />
          <Route
            path="/admin/users"
            element={(
              <RequireAdminAuth>
                <UserDashboard />
              </RequireAdminAuth>
            )}
          />
          <Route
            path="/admin/users/:id"
            element={(
              <RequireAdminAuth>
                <AdminUserProfilePage />
              </RequireAdminAuth>
            )}
          />
          <Route
            path="/admin/profile"
            element={(
              <RequireAdminAuth>
                <AdminProfilePage />
              </RequireAdminAuth>
            )}
          />
          <Route
            path="/admin/settings"
            element={(
              <RequireAdminAuth>
                <AdminSettingsPage />
              </RequireAdminAuth>
            )}
          />
          <Route
            path="/admin/organizations"
            element={(
              <RequireAdminAuth>
                <OrganizationDashboard />
              </RequireAdminAuth>
            )}
          />
          <Route
            path="/admin/organizations/:id"
            element={(
              <RequireAdminAuth>
                <AdminOrganizationProfilePage />
              </RequireAdminAuth>
            )}
          />
          <Route
            path="/admin/reports"
            element={(
              <RequireAdminAuth>
                <ReportsAdmin />
              </RequireAdminAuth>
            )}
          />
          <Route
            path="/admin/donations"
            element={(
              <RequireAdminAuth>
                <DonationAdminPage />
              </RequireAdminAuth>
            )}
          />
          <Route
            path="/admin/transactions"
            element={(
              <RequireAdminAuth>
                <TransactionAdminPage />
              </RequireAdminAuth>
            )}
          />
          <Route
            path="/admin/notifications"
            element={(
              <RequireAdminAuth>
                <AdminNotificationPage />
              </RequireAdminAuth>
            )}
          />
          <Route
            path="/admin/pickups"
            element={(
              <RequireAdminAuth>
                <MaterialPickupAdminPage />
              </RequireAdminAuth>
            )}
          />
          <Route
            path="/donations"
            element={(
              <RequireAuth>
                <MyDonation />
              </RequireAuth>
            )}
          />
          <Route
            path="/donations/view-detail"
            element={(
              <RequireAuth>
                <ViewDetail />
              </RequireAuth>
            )}
          />
          <Route
            path={ROUTES.DONATION_THANK_YOU}
            element={(
              <RequireAuth>
                <DonationThankYouPage />
              </RequireAuth>
            )}
          />
          <Route
            path="/settings/AccountSettings"
            element={(
              <RequireAuth>
                <AccountSettings />
              </RequireAuth>
            )}
          />
          <Route path="/pickup" element={<MaterialPickupPage />} />
          <Route path="/pickup/view-detail" element={<PickupViewDetailPage />} />
          <Route path="/pickup/reschedule" element={<PickupReschedulePage />} />
          <Route
            path="/profile"
            element={(
              <RequireAuth>
                <MyProfilePage />
              </RequireAuth>
            )}
          />
          <Route
            path="/my-profile"
            element={(
              <RequireAuth>
                <MyProfilePage />
              </RequireAuth>
            )}
          />
          <Route path="/settings" element={<div style={{ padding: '2rem' }}>Settings Page</div>} />
        </Routes>
      </Suspense>
      {!hideShell && <Footer />}
    </>
  );

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {appContent}
      </GoogleOAuthProvider>
    );
  }

  return appContent;
}
