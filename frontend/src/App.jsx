import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import ROUTES from './constants/routes.js';
import Home from '@/app/home/page.jsx';
import Navbar from '@/components/Navbar.jsx';
import Footer from '@/components/Footer.jsx';
import CampaignsPage from '@/components/pages/CampaignsPage.jsx';
import CampaignDetailPage from '@/components/pages/CampaignDetailPage.jsx';
import HowItWorksPage from '@/components/pages/HowItWorksPage.jsx';
<<<<<<< HEAD
import Organization from '@/components/pages/organization.jsx';
=======
import AboutPage from '@/components/pages/AboutPage.jsx';
>>>>>>> 8bf4f82a593542df8e5cbf628fc1ff7ee4f88aca

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
<<<<<<< HEAD
        <Route path={ROUTES.ORGANIZATIONS} element={<Organization />} />
=======
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />
>>>>>>> 8bf4f82a593542df8e5cbf628fc1ff7ee4f88aca
        <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
        <Route path={ROUTES.CAMPAIGN_DETAILS()} element={<CampaignDetailRoute />} />
        <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;

