import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

import ROUTES from '@/constants/routes.js';

import HomeRoute from '@/components/HomeRoute';
import DonorCampaignsPage from '@/app/compaigns/compaignDetailAter.jsx';
import DonorCampaignDetailPage from '@/app/compaigns/DonorCampaignDetailPage.jsx';
import MyDonation from '@/app/donate/myDonation.jsx';
import ViewDetail from '@/app/donate/viewDetail.jsx';
import LoginPage from '@/auth/LoginPage.jsx';
import RegisterPage from '@/auth/RegisterPage.jsx';
import AuthLayout from '@/auth/AuthLayout.jsx';
import Footer from '@/components/Footer.jsx';
import Navbar from '@/components/Navbar.jsx';
import AboutPage from '@/components/pages/AboutPage.jsx';
import CampaignDetailPage from '@/components/pages/CampaignDetailPage.jsx';
import CampaignsPage from '@/components/pages/CampaignsPage.jsx';
import ContactPage from '@/components/pages/ContactPage.jsx';
import HowItWorksPage from '@/components/pages/HowItWorksPage.jsx';
import Organization from '@/components/pages/organization.jsx';

function getSafeRedirect(search) {
  const redirectParam = new URLSearchParams(search).get('redirect');
  if (!redirectParam || !redirectParam.startsWith('/')) {
    return ROUTES.HOME;
  }
  return redirectParam;
}

function CampaignDetailRoute() {
  const { id } = useParams();
  return <CampaignDetailPage campaignId={id} />;
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

  if (!session?.isLoggedIn) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}

function LoginRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getSafeRedirect(location.search);

  return (
    <AuthLayout mode="login">
      <LoginPage
        onToggleMode={() => navigate(`/register?redirect=${encodeURIComponent(redirectTo)}`)}
        onLoginSuccess={() => navigate(redirectTo)}
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
      <RegisterPage
        onToggleMode={(email) =>
          navigate(`/login?redirect=${encodeURIComponent(redirectTo)}&email=${encodeURIComponent(email || '')}`)
        }
      />
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
        <Route path={ROUTES.HOME} element={<HomeRoute />} />
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />
        <Route path={ROUTES.ORGANIZATIONS} element={<Organization />} />
        <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
        <Route
          path="/campaigns/donor"
          element={
            <RequireAuth>
              <DonorCampaignsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/campaigns/donor/:id"
          element={
            <RequireAuth>
              <DonorCampaignDetailPage />
            </RequireAuth>
          }
        />
        <Route path={ROUTES.CAMPAIGN_DETAILS()} element={<CampaignDetailRoute />} />
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
        <Route path="/pickup" element={<div>Material Pickup Page</div>} />
      </Routes>
      {!hideShell && <Footer />}
    </>
  );
}
