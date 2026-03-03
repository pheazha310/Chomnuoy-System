// Central route constants for the app
const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  ORGANIZATIONS: '/organizations',
  CAMPAIGNS: '/campaigns',
  CAMPAIGN_DETAILS: (id = ':id') => `/campaigns/${id}`,
  HOW_IT_WORKS: '/how-it-works',
  CONTACT: '/contact',
  LOGIN: '/login',
  LOGOUT: '/logout',
  DASHBOARD: '/dashboard',
};

export default ROUTES;

