import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import ROUTES from '@/constants/routes.js';
import Navbar from '@/components/Navbar.jsx';
import Footer from '@/components/Footer.jsx';
import AuthLayout from '@/auth/AuthLayout.jsx';
import OAuthCallback from '@/auth/OAuthCallback.jsx';
import { useAdminAutoTranslate } from '@/i18n/adminAutoTranslate.js';
import { OrganizationSettingsProvider } from '@/contexts/OrganizationSettingsContext';

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
const ProfilePage = lazy(() => import('@/components/pages/ProfilePage.jsx'));
const LoginPage = lazy(() => import('@/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('@/auth/RegisterPage.jsx'));
const DonorCampaignsPage = lazy(() => import('@/app/compaigns/compaignDetailAter.jsx'));
const MyDonation = lazy(() => import('@/app/donate/myDonation.jsx'));
const ViewDetail = lazy(() => import('@/app/donate/viewDetail.jsx'));
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

function getSafeRedirect(search) {
  const redirectParam = new URLSearchParams(search).get('redirect');
  if (!redirectParam || !redirectParam.startsWith('/')) {
    return ROUTES.HOME;
  }

  return redirectParam;
}

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed) return null;
    if (!parsed.isLoggedIn && (parsed.email || parsed.userId || parsed.role || parsed.accountType)) {
      const normalized = { ...parsed, isLoggedIn: true };
      window.localStorage.setItem('chomnuoy_session', JSON.stringify(normalized));
      return normalized;
    }
    return parsed;
  } catch {
    return null;
  }
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
  if (normalizedPath.startsWith('files/')) {
    return `${apiBase}/${normalizedPath}`;
  }
  const appBase = apiBase.replace(/\/api\/?$/, '');
  if (normalizedPath.startsWith('uploads/') || normalizedPath.startsWith('storage/')) {
    return `${appBase}/${normalizedPath}`;
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
        accountType: normalizedAccountType,
        logoutRedirectTo: redirectTo,
        avatarOverrideKey: avatarOverrideKey || undefined,
      };

      if (data?.token) {
        window.localStorage.setItem('authToken', data.token);
      }

      window.localStorage.setItem('chomnuoy_session', JSON.stringify(sessionData));
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
      accountType: normalizedAccountType,
      logoutRedirectTo: redirectTo,
      avatarOverrideKey: avatarOverrideKey || undefined,
    };

    if (data?.token) {
      window.localStorage.setItem('authToken', data.token);
    }

    window.localStorage.setItem('chomnuoy_session', JSON.stringify(sessionData));
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
  try {
    const rawSession = window.localStorage.getItem('chomnuoy_session');
    const parsedSession = rawSession ? JSON.parse(rawSession) : null;
    const isDonorLoggedIn = Boolean(parsedSession?.isLoggedIn && parsedSession?.role === 'Donor');
    return isDonorLoggedIn ? <OrganizationAfterLogin /> : <OrganizationBeforeLogin />;
  } catch {
    return <OrganizationBeforeLogin />;
  }
}

function HomeRoute() {
  const session = getSession();
  const isDonorLoggedIn = session?.isLoggedIn && session?.role === 'Donor';

  if (isDonorLoggedIn) {
    return <AfterLoginHome />;
  }

  return <Home />;
}

function AfterLoginHomeRoute() {
  const session = getSession();
  const isDonorLoggedIn = session?.isLoggedIn && session?.role === 'Donor';

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

  useEffect(() => {
    if (!session?.isLoggedIn || !session?.userId) return;
    const roleValue = String(session?.role || session?.accountType || '').toLowerCase();
    if (roleValue === 'admin' || roleValue === 'organization') return;

    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const ping = () => {
      fetch(`${apiBase}/users/${session.userId}/last-seen`, { method: 'POST', headers }).catch(() => {});
    };

    ping();
    const intervalId = window.setInterval(ping, 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [apiBase, session?.isLoggedIn, session?.role, session?.accountType, session?.userId]);

  return (
    <>
      {!hideShell && <Navbar />}
      <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
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
            path="/admin/settings"
            element={(
              <RequireAdminAuth>
                <AdminSettingsPage />
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
            path="/admin/reports"
            element={(
              <RequireAdminAuth>
                <ReportsAdmin />
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
                <ProfilePage />
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
}
