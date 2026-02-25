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
