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

  return (
    <div className="page">
      <HeroSection content={heroContent} backendStatus={backendStatus} />
      <StatsSection items={stats} />
      <HighlightsSection items={highlights} />
    </div>
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
