import Footer from './components/Footer.jsx';
import Navbar from './components/Navbar.jsx';
import CampaignsPage from './components/CampaignsPage.jsx';
import CampaignDetailPage from './components/CampaignDetailPage.jsx';
import HowItWorksPage from './components/HowItWorksPage.jsx';

function App() {
  const pathname = window.location.pathname;

  let pageContent = <CampaignsPage />;
  const campaignDetailMatch = pathname.match(/^\/campaigns\/([^/]+)$/);

  if (campaignDetailMatch) {
    pageContent = <CampaignDetailPage campaignId={campaignDetailMatch[1]} />;
  } else if (pathname === '/how-it-works') {
    pageContent = <HowItWorksPage />;
  } else if (pathname === '/campaigns' || pathname === '/') {
    pageContent = <CampaignsPage />;
  }

  return (
    <>
      <Navbar />
      {pageContent}
      <Footer />
    </>
  );
}

export default App;
