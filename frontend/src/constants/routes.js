// Central route constants for the app
const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  ORGANIZATIONS: '/organizations',
  ORGANIZATION_DONATE: (organizationId = ':organizationId') => `/organizations/donate/${organizationId}`,
  CAMPAIGNS: '/campaigns',
  CAMPAIGN_DETAILS: (id = ':id') => `/campaigns/${id}`,
  HOW_IT_WORKS: '/how-it-works',
  CONTACT: '/contact',
  LOGIN: '/login',
  LOGOUT: '/logout',
  DASHBOARD: '/dashboard',
  ORGANIZATION_DASHBOARD: '/organization/dashboard',
  ORGANIZATION_CAMPAIGNS: '/organization/campaigns',
  ORGANIZATION_CAMPAIGN_CREATE: '/organization/campaigns/create',
};

export default ROUTES;

