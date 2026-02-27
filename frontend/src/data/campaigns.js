export const campaigns = [
  {
    id: 'nextgen-solar-charger',
    title: 'NextGen Solar Charger',
    category: 'Technology',
    organization: 'SolTech Solutions',
    summary: 'Powering rural communities with compact, high-efficiency portable solar charging kits.',
    goalAmount: 20000,
    raisedAmount: 15000,
    image:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'ocean-cleanup-project',
    title: 'Ocean Cleanup Project',
    category: 'Social Good',
    organization: 'BlueMarine Org',
    summary: 'Deploying floating collection systems to reduce plastic waste before it reaches shorelines.',
    goalAmount: 50000,
    raisedAmount: 42800,
    image:
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'urban-community-oasis',
    title: 'Urban Community Oasis',
    category: 'Environment',
    organization: 'GreenRoots',
    summary: 'Transforming unused city lots into neighborhood gardens with water-saving infrastructure.',
    goalAmount: 10000,
    raisedAmount: 2450,
    image:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'global-literacy-app',
    title: 'Global Literacy App',
    category: 'Health',
    organization: 'EduReach',
    summary: 'Building multilingual reading tools for children in remote and underserved communities.',
    goalAmount: 15000,
    raisedAmount: 8900,
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'ai-health-diagnostic',
    title: 'AI Health Diagnostic',
    category: 'Technology',
    organization: 'Nova Health Tech',
    summary: 'Developing low-cost AI screening support for faster triage in local clinics.',
    goalAmount: 100000,
    raisedAmount: 102000,
    image:
      'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'green-canvas',
    title: 'The Green Canvas',
    category: 'Creative',
    organization: 'Artisan Collective',
    summary: 'Funding youth-led public murals that promote climate awareness and neighborhood pride.',
    goalAmount: 30000,
    raisedAmount: 5600,
    image:
      'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?auto=format&fit=crop&w=1200&q=80',
  },
];

export function getCampaignById(id) {
  return campaigns.find((campaign) => campaign.id === id) ?? null;
}

