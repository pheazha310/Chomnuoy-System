<<<<<<< HEAD
import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import ROUTES from './constants/routes.js';
import Home from '@/app/home/page.jsx';
import Navbar from '@/components/Navbar.jsx';
import Footer from '@/components/Footer.jsx';
import CampaignsPage from '@/components/pages/CampaignsPage.jsx';
import CampaignDetailPage from '@/components/pages/CampaignDetailPage.jsx';
import HowItWorksPage from '@/components/pages/HowItWorksPage.jsx';
import Organization from '@/components/pages/organization.jsx';
import AboutPage from '@/components/pages/AboutPage.jsx';

function CampaignDetailRoute() {
  const { id } = useParams();
  return <CampaignDetailPage campaignId={id} />;
}

function App() {
=======
import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import { fetchBackendHealth } from './api/backendApi.js';

import HeroSection from './components/HeroSection.jsx';
import HighlightsSection from './components/HighlightsSection.jsx';
import StatsSection from './components/StatsSection.jsx';

import { heroContent, highlights, stats } from './data/homeContent.js';

import RegisterPage from './pages/RegisterPage.jsx';

function Home() {
  const [backendStatus, setBackendStatus] = useState({
    state: 'loading',
    message: 'Connecting to Laravel backend...',
  });

  useEffect(() => {
    let active = true;

    async function loadBackendStatus() {
      try {
        const health = await fetchBackendHealth();

        if (!active) {
          return;
        }

        setBackendStatus({
          state: 'success',
          message: `${health.service}: ${health.status}`,
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setBackendStatus({
          state: 'error',
          message: 'Backend unavailable. Start Laravel server on http://127.0.0.1:8000',
        });
      }
    }

    loadBackendStatus();

    return () => {
      active = false;
    };
  }, []);

>>>>>>> 0cabdfdf3a5911ee2bb7eb8b80de004a025fd7bb
  return (
    <>
      <Navbar />
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.ORGANIZATIONS} element={<Organization />} />
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />
        <Route path={ROUTES.ORGANIZATIONS} element={<Organization />} />
        <Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
        <Route path={ROUTES.CAMPAIGN_DETAILS()} element={<CampaignDetailRoute />} />
        <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Routes>

      {/* Home page */}
      <Route path="/" element={<Home />} />

      {/* Register page*/}
      <Route path="/register" element={<RegisterPage />} />

    </Routes>
  );
}
export default App;

