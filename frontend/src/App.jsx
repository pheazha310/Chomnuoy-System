import { Navigate, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import ROUTES from '@/constants/routes.js';
import Home from '@/app/home/page.jsx';
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
import OrganizationDashboardPage from '@/app/organization/page.jsx';

function getSafeRedirect(search) {
  const redirectParam = new URLSearchParams(search).get('redirect');
  if (!redirectParam || !redirectParam.startsWith('/')) {
    return ROUTES.CAMPAIGNS;
  }

  return redirectParam;
}

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

function LoginRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getSafeRedirect(location.search);
  const loginEmail = new URLSearchParams(location.search).get('email');

  const handleLoginSuccess = (data) => {
    const isOrganization = data?.account_type === 'Organization';
    const profile = isOrganization ? data?.organization : data?.user;

    if (!profile) {
      throw new Error('Login response missing profile data');
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

    window.localStorage.setItem('chomnuoy_session', JSON.stringify(sessionData));

    if (isOrganization) {
      navigate(ROUTES.ORGANIZATION_DASHBOARD);
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

function CampaignDetailRoute() {
  const { id, campaignSlug } = useParams();
  return <CampaignDetailPage campaignId={campaignSlug || id} />;
}

export default function App() {
  const location = useLocation();
  const hideShell =
    location.pathname === ROUTES.LOGIN ||
    location.pathname === '/register' ||
    location.pathname === ROUTES.ORGANIZATION_DASHBOARD;

  return (
    <>
      {!hideShell && <Navbar />}
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />
        <Route path={ROUTES.ORGANIZATIONS} element={<Organization />} />
        <Route path={ROUTES.ORGANIZATION_DONATE()} element={<Organization />} />
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
        <Route path="/donations" element={<MyDonation />} />
        <Route path="/donations/view-detail" element={<ViewDetail />} />
        <Route path="/pickup" element={<div style={{ padding: '2rem' }}>Material Pickup Page</div>} />
        <Route path="/profile" element={<div style={{ padding: '2rem' }}>My Profile Page</div>} />
        <Route path="/settings" element={<div style={{ padding: '2rem' }}>Settings Page</div>} />
      </Routes>
      {!hideShell && <Footer />}
    </>
  );
}
