export const donorCampaigns = [
  {
    id: 'clean-water-villages',
    title: 'Clean Water for Villages',
    description: 'Providing sustainable clean water solutions for remote communities.',
    image:
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    category: 'Environment',
    raised: 15000,
    goal: 20000,
    timeLeft: '3 days left',
    location: 'Kampong Speu, Cambodia',
    organizerName: 'WaterLife Foundation',
    organizerCampaignCount: 12,
    isUrgent: true,
  },
  {
    id: 'books-rural-schools',
    title: 'Books for Rural Schools',
    description: 'Equipping rural school libraries with textbooks and digital resources.',
    image:
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
    category: 'Education',
    raised: 5200,
    goal: 12000,
    timeLeft: '12 days left',
    location: 'Pursat, Cambodia',
    organizerName: 'Bright Futures Education NGO',
    organizerCampaignCount: 8,
  },
  {
    id: 'medical-aid-refugees',
    title: 'Medical Aid for Refugees',
    description: 'Funding mobile clinics and essential medicine for displaced families.',
    image:
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    category: 'Medical',
    raised: 42800,
    goal: 50000,
    timeLeft: '24 hours left',
    location: 'Battambang, Cambodia',
    organizerName: 'CareBridge Health',
    organizerCampaignCount: 19,
  },
  {
    id: 'urban-forest-initiative',
    title: 'Urban Forest Initiative',
    description: 'Planting 5,000 trees to reduce heat islands and improve air quality.',
    image:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    category: 'Environment',
    raised: 1200,
    goal: 30000,
    timeLeft: '45 days left',
    location: 'Phnom Penh, Cambodia',
    organizerName: 'Green Cities Network',
    organizerCampaignCount: 6,
    isNew: true,
  },
  {
    id: 'winter-warmth-drive',
    title: 'Winter Warmth Drive',
    description: 'Providing coats, blankets, and hot meals during severe winter months.',
    image:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    category: 'Social Welfare',
    raised: 8900,
    goal: 10000,
    timeLeft: '5 days left',
    location: 'Siem Reap, Cambodia',
    organizerName: 'Community Relief Collective',
    organizerCampaignCount: 14,
  },
  {
    id: 'youth-coding-bootcamp',
    title: 'Youth Coding Bootcamp',
    description: 'Training underprivileged youth with practical coding and job skills.',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    category: 'Education',
    raised: 2500,
    goal: 15000,
    timeLeft: '28 days left',
    location: 'Takeo, Cambodia',
    organizerName: 'Code4Youth Cambodia',
    organizerCampaignCount: 5,
  },
];

export function getDonorCampaignById(id) {
  return donorCampaigns.find((campaign) => campaign.id === id) ?? null;
}
