<<<<<<< HEAD
import { Routes, Route } from 'react-router-dom';
import ROUTES from '@/constants/routes.js';
=======
import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import ROUTES from './constants/routes.js';
>>>>>>> 74fe07b9ac0d8783a68b253bc9bdcd8010bb90b6
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

