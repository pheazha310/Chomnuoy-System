<<<<<<< HEAD
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
=======
<<<<<<< HEAD
import { Navigate, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
=======
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
>>>>>>> dc0d7f5ef42ec18bf989219fbaab3f39829e2c44
>>>>>>> cb91254f17bf3b33525d32fdea323e59e46ae4c0
import ROUTES from '@/constants/routes.js';
import Home from '@/app/home/page.jsx';
import AfterLoginHome from '@/app/home/AfterLoginHome.jsx';
import Navbar from '@/components/Navbar.jsx';
import Footer from '@/components/Footer.jsx';
import CampaignsPage from '@/components/pages/CampaignsPage.jsx';
import CampaignDetailPage from '@/components/pages/CampaignDetailPage.jsx';
import HowItWorksPage from '@/components/pages/HowItWorksPage.jsx';
import Organization from '@/components/pages/organization.jsx';
<<<<<<< HEAD
import AboutPage from '@/components/pages/AboutPage.jsx';
import ContactPage from '@/components/pages/ContactPage.jsx';
=======
<<<<<<< HEAD
import AboutPage from '@/components/pages/AboutPage.jsx';
import ContactPage from '@/components/pages/ContactPage.jsx';
=======
>>>>>>> dc0d7f5ef42ec18bf989219fbaab3f39829e2c44
>>>>>>> cb91254f17bf3b33525d32fdea323e59e46ae4c0
import LoginPage from '@/auth/LoginPage.jsx';
import RegisterPage from '@/auth/RegisterPage.jsx';
import AuthLayout from '@/auth/AuthLayout.jsx';
import DonorCampaignsPage from '@/app/compaigns/compaignDetailAter.jsx';
import MyDonation from '@/app/donate/myDonation.jsx';

function getSafeRedirect(search) {
  const redirectParam = new URLSearchParams(search).get('redirect');
  if (!redirectParam || !redirectParam.startsWith('/')) {
    return ROUTES.HOME;
  }

  return redirectParam;
}

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> cb91254f17bf3b33525d32fdea323e59e46ae4c0
function CampaignDetailRoute() {
  const { id, campaignSlug } = useParams();
  return <CampaignDetailPage campaignId={campaignSlug || id} />;
}

<<<<<<< HEAD
=======
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

=======
>>>>>>> dc0d7f5ef42ec18bf989219fbaab3f39829e2c44
>>>>>>> cb91254f17bf3b33525d32fdea323e59e46ae4c0
function LoginRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getSafeRedirect(location.search);
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> cb91254f17bf3b33525d32fdea323e59e46ae4c0
  const loginEmail = new URLSearchParams(location.search).get('email');

  const handleLoginSuccess = (data) => {
    const isOrganization = data?.account_type === 'Organization';
    const profile = isOrganization ? data?.organization : data?.user;

    if (!profile) {
      throw new Error('Login response missing profile data');
    }
<<<<<<< HEAD
=======
>>>>>>> dc0d7f5ef42ec18bf989219fbaab3f39829e2c44
>>>>>>> cb91254f17bf3b33525d32fdea323e59e46ae4c0

    const sessionData = {
      isLoggedIn: true,
      role: isOrganization ? 'Organization' : 'Donor',
      name: profile.name,
      email: profile.email || loginEmail || '',
      impactLevel: isOrganization ? 'Organization' : 'Gold',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80',
<<<<<<< HEAD
      userId: profile.id,
      accountType: data?.account_type ?? (isOrganization ? 'Organization' : 'Donor'),
=======
<<<<<<< HEAD
      userId: data.user.id,
      logoutRedirectTo: redirectTo,
=======
      userId: profile.id,
      accountType: data?.account_type ?? (isOrganization ? 'Organization' : 'Donor'),
>>>>>>> dc0d7f5ef42ec18bf989219fbaab3f39829e2c44
>>>>>>> cb91254f17bf3b33525d32fdea323e59e46ae4c0
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
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======

function CampaignDetailRoute() {
  const { id, campaignSlug } = useParams();
  return <CampaignDetailPage campaignId={campaignSlug || id} />;
}
>>>>>>> dc0d7f5ef42ec18bf989219fbaab3f39829e2c44
>>>>>>> cb91254f17bf3b33525d32fdea323e59e46ae4c0

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
  const hideShell = location.pathname === ROUTES.LOGIN || location.pathname === '/register';

  return (
    <>
      {!hideShell && <Navbar />}
      <Routes>
<<<<<<< HEAD
        <Route path={ROUTES.HOME} element={isAuthenticated ? <AfterLoginHome /> : <Home />} />
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />
=======
<<<<<<< HEAD
        <Route path={ROUTES.HOME} element={isAuthenticated ? <AfterLoginHome /> : <Home />} />
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />
=======
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.ABOUT} element={<div style={{ padding: '2rem' }}>About Page</div>} />
>>>>>>> dc0d7f5ef42ec18bf989219fbaab3f39829e2c44
>>>>>>> cb91254f17bf3b33525d32fdea323e59e46ae4c0
        <Route path={ROUTES.ORGANIZATIONS} element={<Organization />} />
        <Route path={ROUTES.ORGANIZATION_DONATE()} element={<Organization />} />
        <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
        <Route path="/campaigns/donor" element={<DonorCampaignsPage />} />
        <Route path={ROUTES.CAMPAIGN_DETAILS()} element={<CampaignDetailRoute />} />
        <Route path="/campaigns/:campaignSlug" element={<CampaignDetailRoute />} />
        <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
<<<<<<< HEAD
        <Route path={ROUTES.CONTACT} element={<ContactPage />} />
=======
<<<<<<< HEAD
        <Route path={ROUTES.CONTACT} element={<ContactPage />} />
=======
        <Route path={ROUTES.CONTACT} element={<div style={{ padding: '2rem' }}>Contact Page</div>} />
>>>>>>> dc0d7f5ef42ec18bf989219fbaab3f39829e2c44
>>>>>>> cb91254f17bf3b33525d32fdea323e59e46ae4c0
        <Route path={ROUTES.LOGIN} element={<LoginRoute />} />
        <Route path="/register" element={<RegisterRoute />} />
        <Route path="/donations" element={<MyDonation />} />
        <Route path="/pickup" element={<div style={{ padding: '2rem' }}>Material Pickup Page</div>} />
        <Route path="/profile" element={<div style={{ padding: '2rem' }}>My Profile Page</div>} />
        <Route path="/settings" element={<div style={{ padding: '2rem' }}>Settings Page</div>} />
      </Routes>
      {!hideShell && <Footer />}
    </>
  );
}
