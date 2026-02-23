import HeroSection from './components/HeroSection.jsx';
import HighlightsSection from './components/HighlightsSection.jsx';
import StatsSection from './components/StatsSection.jsx';
import { heroContent, highlights, stats } from './data/homeContent.js';

function App() {
  return (
    <div className="page">
      <HeroSection content={heroContent} />
      <StatsSection items={stats} />
      <HighlightsSection items={highlights} />
    </div>
  );
}

export default App;
