// Central route constants for the app
const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CAMPAIGNS: '/campaigns',
  CAMPAIGN_DETAILS: (id = ':id') => `/campaigns/${id}`,
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
};

export default ROUTES;
