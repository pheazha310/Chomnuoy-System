export const organizations = [
  {
    id: 1,
    name: 'Literacy for All',
    summary: 'Empowering underprivileged youth through accessible education and mentorship programs.',
    tags: ['Education', 'Youth'],
    rating: 4.9,
    reviews: '1.2k',
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 2,
    name: 'Green Earth Initiative',
    summary: 'Focused on reforestation and sustainable farming practices to combat climate change in local communities.',
    tags: ['Environment', 'Climate'],
    rating: 4.7,
    reviews: '856',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 3,
    name: 'Health First Network',
    summary: 'Providing essential healthcare services and medical supplies to remote villages and urban families in need.',
    tags: ['Health', 'Emergency'],
    rating: 4.8,
    reviews: '520',
    image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 4,
    name: 'Community Core',
    summary: 'Strengthening community ties through shared resources, local events, and neighborhood collaboration.',
    tags: ['Community', 'Social'],
    rating: 4.6,
    reviews: '342',
    image: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 5,
    name: 'MindWell Alliance',
    summary: 'Dedicated to mental health awareness and counseling support for people facing stress and trauma.',
    tags: ['Health', 'Mental Health'],
    rating: 4.9,
    reviews: '215',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 6,
    name: 'Urban Uplift Foundation',
    summary: 'Transforming urban spaces into thriving hubs of opportunity through grants and training programs.',
    tags: ['Economy', 'Training'],
    rating: 4.5,
    reviews: '189',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=960&q=80',
  },
];

export const donorOrganizations = [
  {
    id: 101,
    name: 'Global Scholars Fund',
    summary: 'Empowering underprivileged youth through sustainable education scholarships.',
    category: 'Education',
    region: 'Phnom Penh',
    verified: true,
    taxEligible: true,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=960&q=80',
    metricLeftLabel: 'Impact Score',
    metricLeftValue: '94/100',
    metricRightLabel: 'Live Projects',
    metricRightValue: '12 Active',
  },
  {
    id: 102,
    name: 'Rural Health Alliance',
    summary: 'Providing essential medical supplies and mobile clinics to underserved areas.',
    category: 'Healthcare',
    region: 'Siem Reap',
    verified: true,
    taxEligible: true,
    image: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=960&q=80',
    metricLeftLabel: 'Impact Score',
    metricLeftValue: '88/100',
    metricRightLabel: 'Funds Raised',
    metricRightValue: '$240k',
  },
  {
    id: 103,
    name: 'Ocean Reclaim Project',
    summary: 'Dedicated to large-scale ocean cleanup and coastal habitat restoration work.',
    category: 'Environment',
    region: 'Kampot',
    verified: true,
    taxEligible: false,
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=960&q=80',
    metricLeftLabel: 'Plastic Removed',
    metricLeftValue: '45 Tons',
    metricRightLabel: 'Communities',
    metricRightValue: '28 Active',
  },
  {
    id: 104,
    name: 'Equal Voices Network',
    summary: 'Advocating for legislative change and legal access for vulnerable communities.',
    category: 'Human Rights',
    region: 'Battambang',
    verified: true,
    taxEligible: true,
    image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=960&q=80',
    metricLeftLabel: 'Impact Score',
    metricLeftValue: '91/100',
    metricRightLabel: 'Volunteers',
    metricRightValue: '4.2k',
  },
  {
    id: 105,
    name: 'Future Skills Hub',
    summary: 'Building digital literacy and job readiness for youth and women.',
    category: 'Education',
    region: 'Phnom Penh',
    verified: false,
    taxEligible: true,
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=960&q=80',
    metricLeftLabel: 'Impact Score',
    metricLeftValue: '84/100',
    metricRightLabel: 'Active Learners',
    metricRightValue: '1.6k',
  },
];

export const PAGE_SIZE = 3;
export const DONOR_PAGE_SIZE = 4;

export const DONATION_PRESET_AMOUNTS = [5, 10, 20, 50];
export const DONATION_PAYMENT_METHODS = [
  { id: 'khqr', label: 'Bakong KHQR', badge: 'KHQR', badgeClassName: 'payment-badge-qr' },
];

export const RATING_OPTIONS = [
  { value: 'all', label: 'All Ratings' },
  { value: '4plus', label: 'Rating: 4+ Stars' },
  { value: '45plus', label: 'Rating: 4.5+ Stars' },
];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'ratingHigh', label: 'Rating: High to Low' },
  { value: 'ratingLow', label: 'Rating: Low to High' },
  { value: 'nameAZ', label: 'Name: A to Z' },
  { value: 'nameZA', label: 'Name: Z to A' },
];

export const DONOR_SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'nameAZ', label: 'Name A-Z' },
  { value: 'impactHigh', label: 'Impact Score' },
];

export function getPaginationItems(totalPages, currentPage) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const validPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const items = [];

  for (let index = 0; index < validPages.length; index += 1) {
    const page = validPages[index];
    const previousPage = validPages[index - 1];

    if (index > 0 && page - previousPage > 1) {
      items.push('...');
    }

    items.push(page);
  }

  return items;
}

export function getDonorSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
