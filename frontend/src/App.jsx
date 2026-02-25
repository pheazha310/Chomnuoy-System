import { Routes, Route } from 'react-router-dom';
import ROUTES from '@/constants/routes.js';
import Home from '@/app/home/page.jsx';
import Campaigns from '@/app/compaigns/page.jsx';

function App() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.CAMPAIGNS} element={<Campaigns />} />
    </Routes>
  );
}

export default App;
