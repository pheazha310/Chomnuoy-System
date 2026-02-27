<<<<<<< HEAD
import { Routes, Route, useNavigate } from 'react-router-dom';

import ROUTES from './constants/routes.js';
import Home from './app/home/page.jsx';
import Campaigns from './app/compaigns/page.jsx';
import LoginPage from './auth/LoginPage.jsx';
import RegisterPage from './auth/RegisterPage.jsx';
import AuthLayout from './auth/AuthLayout.jsx';

function LoginRoute() {
  const navigate = useNavigate();

  return (
    <AuthLayout mode="login">
      <LoginPage onToggleMode={() => navigate('/register')} />
    </AuthLayout>
  );
}

function RegisterRoute() {
  const navigate = useNavigate();

  return (
    <AuthLayout mode="register">
      <RegisterPage onToggleMode={() => navigate('/login')} />
    </AuthLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.CAMPAIGNS} element={<Campaigns />} />
      <Route path={ROUTES.LOGIN} element={<LoginRoute />} />
      <Route path="/register" element={<RegisterRoute />} />
    </Routes>
  );
}
=======
import { Routes, Route, useParams } from 'react-router-dom';
import ROUTES from '@/constants/routes.js';
import Home from '@/app/home/page.jsx';
import Navbar from '@/components/Navbar.jsx';
import Footer from '@/components/Footer.jsx';
import CampaignsPage from '@/components/pages/CampaignsPage.jsx';
import CampaignDetailPage from '@/components/pages/CampaignDetailPage.jsx';
import HowItWorksPage from '@/components/pages/HowItWorksPage.jsx';

function CampaignDetailRoute() {
  const { id } = useParams();
  return <CampaignDetailPage campaignId={id} />;
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
        <Route path={ROUTES.CAMPAIGN_DETAILS()} element={<CampaignDetailRoute />} />
        <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
      </Routes>
      <Footer />
    </>
  );
}


export default App;
>>>>>>> 084ae4ffe30491285b8bfb6323c8b9359f40c7b5
