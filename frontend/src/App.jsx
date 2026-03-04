import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
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

function getSafeRedirect(search) {
  const redirectParam = new URLSearchParams(search).get('redirect');
  if (!redirectParam || !redirectParam.startsWith('/')) {
    return ROUTES.CAMPAIGNS;
  }

  return redirectParam;
}

function CampaignDetailRoute() {
  const { id } = useParams();
  return <CampaignDetailPage campaignId={id} />;
}

function LoginRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getSafeRedirect(location.search);

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
      email: profile.email,
      impactLevel: isOrganization ? 'Organization' : 'Gold',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80',
      userId: profile.id,
      accountType: data?.account_type ?? (isOrganization ? 'Organization' : 'Donor'),
    };
    
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
    // After successful registration, redirect to login with email
    navigate(`/login?redirect=${encodeURIComponent(redirectTo)}&email=${encodeURIComponent(email || '')}`);
  };

  return (
    <AuthLayout mode="register">
      <RegisterPage onToggleMode={handleRegisterSuccess} />
    </AuthLayout>
  );
}

export default function App() {
  const location = useLocation();
  const hideShell = location.pathname === ROUTES.LOGIN || location.pathname === '/register';

  return (
    <>
      {!hideShell && <Navbar />}
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />
        <Route path={ROUTES.ORGANIZATIONS} element={<Organization />} />
        <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
        <Route path={ROUTES.CAMPAIGN_DETAILS()} element={<CampaignDetailRoute />} />
        <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
        <Route path={ROUTES.CONTACT} element={<ContactPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginRoute />} />
        <Route path="/register" element={<RegisterRoute />} />
      </Routes>
      {!hideShell && <Footer />}
    </>
  );
}
