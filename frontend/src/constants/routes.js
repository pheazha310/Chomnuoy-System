// Central route constants for the app
const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CAMPAIGNS: '/campaigns',
  CAMPAIGN_DETAILS: (id = ':id') => `/campaigns/${id}`,
  HOW_IT_WORKS: '/how-it-works',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
};

export default ROUTES;

