import { Navigate, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import ROUTES from '@/constants/routes.js';
import Home from '@/app/home/page.jsx';
import AfterLoginHome from '@/app/home/AfterLoginHome.jsx';
import Navbar from '@/components/Navbar.jsx';
import Footer from '@/components/Footer.jsx';
import CampaignsPage from '@/components/pages/CampaignsPage.jsx';
import CampaignDetailPage from '@/components/pages/CampaignDetailPage.jsx';
import HowItWorksPage from '@/components/pages/HowItWorksPage.jsx';
import Organization from '@/components/pages/organization.jsx';
import AboutPage from '@/components/pages/AboutPage.jsx';
import ContactPage from '@/components/pages/ContactPage.jsx';
import LoginPage from '@/auth/LoginPage.jsx';
import RegisterPage from '@/auth/RegisterPage.jsx';
import AuthLayout from '@/auth/AuthLayout.jsx';
import DonorCampaignsPage from '@/app/compaigns/compaignDetailAter.jsx';
import MyDonation from '@/app/donate/myDonation.jsx';
import ViewDetail from '@/app/donate/viewDetail.jsx';
import AccountSettings from '@/app/setting/AccountSettings.jsx';

function getSafeRedirect(search) {
  const redirectParam = new URLSearchParams(search).get('redirect');
  if (!redirectParam || !redirectParam.startsWith('/')) {
    return ROUTES.HOME;
  }

  return redirectParam;
}

function CampaignDetailRoute() {
  const { campaignSlug } = useParams();
  return <CampaignDetailPage campaignId={campaignSlug} />;
}

function RequireAuth({ children }) {
  const location = useLocation();
  const rawSession = window.localStorage.getItem('chomnuoy_session');
  let session = null;
  try {
    session = rawSession ? JSON.parse(rawSession) : null;
  } catch {
    session = null;
  }
  const isLoggedIn = Boolean(session?.isLoggedIn);

  if (!isLoggedIn) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}

function LoginRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getSafeRedirect(location.search);
  const loginEmail = new URLSearchParams(location.search).get('email');

  const handleLoginSuccess = (data) => {
    const isOrganization = data?.account_type === 'Organization';
    const profile = isOrganization ? data?.organization : data?.user;

    if (!profile) {
      // Fallback for different data structures
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
      };
      if (data?.token) {
        window.localStorage.setItem('authToken', data.token);
      }
      window.localStorage.setItem('chomnuoy_session', JSON.stringify(sessionData));
      navigate(redirectTo);
      return;
    }

    // Store user session data
    const sessionData = {
      isLoggedIn: true,
      role: isOrganization ? 'Organization' : 'Donor',
      name: profile.name,
      email: profile.email || loginEmail || '',
      impactLevel: isOrganization ? 'Organization' : 'Gold',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80',
      userId: profile.id,
      accountType: data?.account_type ?? (isOrganization ? 'Organization' : 'Donor'),
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

  const handleRegisterSuccess = (email) => {
    navigate(`/login?redirect=${encodeURIComponent(redirectTo)}&email=${encodeURIComponent(email || '')}`);
  };

  return (
    <AuthLayout mode="register">
      <RegisterPage onToggleMode={handleRegisterSuccess} />
    </AuthLayout>
  );
}

function CampaignDetailRoute2() {
  const { id, campaignSlug } = useParams();
  return <CampaignDetailPage campaignId={campaignSlug || id} />;
}

export default function App() {
  const location = useLocation();
  let hasDonorSession = false;
  try {
    const rawSession = window.localStorage.getItem('chomnuoy_session');
    const parsedSession = rawSession ? JSON.parse(rawSession) : null;
    hasDonorSession = Boolean(parsedSession?.isLoggedIn && parsedSession?.role === 'Donor');
  } catch {
    hasDonorSession = false;
  }

  const hasAuthToken = Boolean(window.localStorage.getItem('authToken'));
  const isAuthenticated = hasAuthToken || hasDonorSession;
  const hideShell =
    location.pathname === ROUTES.LOGIN ||
    location.pathname === '/register';

  return (
    <>
      {!hideShell && <Navbar />}
      <Routes>
        <Route path={ROUTES.HOME} element={isAuthenticated ? <AfterLoginHome /> : <Home />} />
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />
        <Route path={ROUTES.ORGANIZATIONS} element={<Organization />} />
        <Route path={ROUTES.ORGANIZATION_DONATE()} element={<Organization />} />
        <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
        <Route path="/campaigns/donor" element={<DonorCampaignsPage />} />
        <Route path={ROUTES.CAMPAIGN_DETAILS()} element={<CampaignDetailRoute2 />} />
        <Route path="/campaigns/:campaignSlug" element={<CampaignDetailRoute2 />} />
        <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
        <Route path={ROUTES.CONTACT} element={<ContactPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginRoute />} />
        <Route path="/register" element={<RegisterRoute />} />
        <Route
          path="/donations"
          element={
            <RequireAuth>
              <MyDonation />
            </RequireAuth>
          }
        />
        <Route
          path="/donations/view-detail"
          element={
            <RequireAuth>
              <ViewDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/settings/AccountSettings"
          element={
            <RequireAuth>
              <AccountSettings />
            </RequireAuth>
          }
        />
        <Route path="/pickup" element={<div>Material Pickup Page</div>} />
      </Routes>
      {!hideShell && <Footer />}
    </>
  );
}
