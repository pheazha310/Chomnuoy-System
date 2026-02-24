<<<<<<< HEAD
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

=======
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ROUTES from './constants/routes.js';
import Home from '@/app/home/page.jsx';
import Campaigns from '@/app/compaigns/page.jsx';

function App() {
>>>>>>> 4ceedd04f39626b7f7e99a2eff8a8475e9666ba6
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.CAMPAIGNS} element={<Campaigns />} />
    </Routes>
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
