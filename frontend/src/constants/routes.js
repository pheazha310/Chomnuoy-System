// Central route constants for the app
const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  ORGANIZATIONS: '/organizations',
  ORGANIZATION_DONATE: (organizationId = ':organizationId') => `/organizations/donate/${organizationId}`,
  ORGANIZATION_PROFILE: (id = ':id') => `/organizations/${id}`,
  CAMPAIGNS: '/campaigns',
  CAMPAIGN_DETAILS: (id = ':id') => `/campaigns/${id}`,
  HOW_IT_WORKS: '/how-it-works',
  CONTACT: '/contact',
  LOGIN: '/login',
  LOGOUT: '/logout',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  ORGANIZATION_DASHBOARD: '/organization/dashboard',
  ORGANIZATION_REPORTS: '/organization/reports',
  ORGANIZATION_CAMPAIGNS: '/organization/campaigns',
  ORGANIZATION_CAMPAIGN_CREATE: '/organization/campaigns/create',
  ORGANIZATION_CAMPAIGN_DETAIL: (id = ':id') => `/organization/campaigns/${id}`,
};

export default ROUTES;

