<<<<<<< HEAD
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
=======
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
>>>>>>> bee7e27391ac0c1f56f076ec0681cd1b81721999
import ROUTES from '@/constants/routes.js';
import Home from '@/app/home/page.jsx';
import Navbar from '@/components/Navbar.jsx';
import Footer from '@/components/Footer.jsx';
import CampaignsPage from '@/components/pages/CampaignsPage.jsx';
import CampaignDetailPage from '@/components/pages/CampaignDetailPage.jsx';
import HowItWorksPage from '@/components/pages/HowItWorksPage.jsx';
<<<<<<< HEAD
import OrganizationBeforeLogin from '@/components/pages/OrganizationBeforeLogin.jsx';
import OrganizationAfterLogin from '@/components/pages/OrganizationAfterLogin.jsx';
import AboutPage from '@/components/pages/AboutPage.jsx';
import ContactPage from '@/components/pages/ContactPage.jsx';
import LoginPage from '@/auth/LoginPage.jsx';
import RegisterPage from '@/auth/RegisterPage.jsx';
import AuthLayout from '@/auth/AuthLayout.jsx';
import DonorCampaignsPage from '@/app/compaigns/compaignDetailAter.jsx';
import MyDonation from '@/app/donate/myDonation.jsx';
import ViewDetail from '@/app/donate/viewDetail.jsx';
import AccountSettings from '@/app/setting/AccountSettings.jsx';
import OrganizationDashboardPage from '@/app/organization/page.jsx';
import MaterialPickupPage from '@/app/material-pickup.jsx/materialPickup.jsx';
import PickupViewDetailPage from '@/app/material-pickup.jsx/pickupViewDetail.jsx';
import PickupReschedulePage from '@/app/material-pickup.jsx/pickupReschedule.jsx';
=======
import Organization from '@/components/pages/organization.jsx';
import LoginPage from '@/auth/LoginPage.jsx';
import RegisterPage from '@/auth/RegisterPage.jsx';
import AuthLayout from '@/auth/AuthLayout.jsx';
>>>>>>> bee7e27391ac0c1f56f076ec0681cd1b81721999

function getSafeRedirect(search) {
  const redirectParam = new URLSearchParams(search).get('redirect');
  if (!redirectParam || !redirectParam.startsWith('/')) {
    return ROUTES.CAMPAIGNS;
  }

  return redirectParam;
}

<<<<<<< HEAD
function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
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
  const isOrganization = Boolean(session?.isLoggedIn && session?.role === 'Organization');

  if (!isOrganization) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}

=======
>>>>>>> bee7e27391ac0c1f56f076ec0681cd1b81721999
function LoginRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getSafeRedirect(location.search);
  const loginEmail = new URLSearchParams(location.search).get('email');

  const handleLoginSuccess = (data) => {
    const isOrganization = data?.account_type === 'Organization';
<<<<<<< HEAD
    const profile = isOrganization ? data?.organization : data?.user;

    if (!profile) {
      const user = data?.user || data || {};
      const sessionData = {
        isLoggedIn: true,
        role: user.role || 'Donor',
        name: user.name || 'Donor User',
        email: user.email || loginEmail || '',
        impactLevel: 'Gold',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80',
        userId: user.id || null,
        accountType: data?.account_type || 'Donor',
        logoutRedirectTo: redirectTo,
      };

      if (data?.token) {
        window.localStorage.setItem('authToken', data.token);
      }

      window.localStorage.setItem('chomnuoy_session', JSON.stringify(sessionData));
      navigate(redirectTo);
      return;
    }
=======
    const profile = isOrganization
      ? (data?.organization ?? data?.user ?? data)
      : (data?.user ?? data?.organization ?? data);
>>>>>>> bee7e27391ac0c1f56f076ec0681cd1b81721999

    const sessionData = {
      isLoggedIn: true,
      role: isOrganization ? 'Organization' : 'Donor',
      name: profile?.name || 'User',
      email: profile?.email || loginEmail || '',
      impactLevel: isOrganization ? 'Organization' : 'Gold',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80',
<<<<<<< HEAD
      userId: profile.id,
      accountType: data?.account_type ?? (isOrganization ? 'Organization' : 'Donor'),
      logoutRedirectTo: redirectTo,
=======
      userId: profile?.id ?? null,
      accountType: data?.account_type ?? (isOrganization ? 'Organization' : 'Donor'),
>>>>>>> bee7e27391ac0c1f56f076ec0681cd1b81721999
    };

    if (data?.token) {
      window.localStorage.setItem('authToken', data.token);
    }

    window.localStorage.setItem('chomnuoy_session', JSON.stringify(sessionData));
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

<<<<<<< HEAD
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
=======
function CampaignDetailRoute() {
  const { id, campaignSlug } = useParams();
  return <CampaignDetailPage campaignId={campaignSlug || id} />;
>>>>>>> bee7e27391ac0c1f56f076ec0681cd1b81721999
}

export default function App() {
  const location = useLocation();
<<<<<<< HEAD
  const hideShell =
    location.pathname === ROUTES.LOGIN ||
    location.pathname === '/register' ||
    location.pathname === ROUTES.ORGANIZATION_DASHBOARD;
=======
  const hideShell = location.pathname === ROUTES.LOGIN || location.pathname === '/register';
>>>>>>> bee7e27391ac0c1f56f076ec0681cd1b81721999

  return (
    <>
      {!hideShell && <Navbar />}
      <Routes>
<<<<<<< HEAD
        <Route path={ROUTES.HOME} element={<HomeRoute />} />
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
              <OrganizationDashboardPage />
            </RequireOrganizationAuth>
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
=======
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.ABOUT} element={<div style={{ padding: '2rem' }}>About Page</div>} />
        <Route path={ROUTES.ORGANIZATIONS} element={<Organization />} />
        <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
        <Route path="/campaigns/donor" element={<div style={{ padding: '2rem' }}>Donor Campaigns Page</div>} />
        <Route path={ROUTES.CAMPAIGN_DETAILS()} element={<CampaignDetailRoute />} />
        <Route path="/campaigns/:campaignSlug" element={<CampaignDetailRoute />} />
        <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
        <Route path={ROUTES.CONTACT} element={<div style={{ padding: '2rem' }}>Contact Page</div>} />
        <Route path={ROUTES.LOGIN} element={<LoginRoute />} />
        <Route path="/register" element={<RegisterRoute />} />
        <Route path="/donations" element={<div style={{ padding: '2rem' }}>My Donations Page</div>} />
        <Route path="/pickup" element={<div style={{ padding: '2rem' }}>Material Pickup Page</div>} />
>>>>>>> bee7e27391ac0c1f56f076ec0681cd1b81721999
        <Route path="/profile" element={<div style={{ padding: '2rem' }}>My Profile Page</div>} />
        <Route path="/settings" element={<div style={{ padding: '2rem' }}>Settings Page</div>} />
      </Routes>
      {!hideShell && <Footer />}
    </>
  );
}
