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
  {
    id: 'village-water-access',
    title: 'Village Water Access',
    category: 'Social Good',
    organization: 'ClearSpring Initiative',
    summary: 'Installing community water filters and storage tanks for families affected by seasonal droughts.',
    goalAmount: 45000,
    raisedAmount: 18350,
    image:
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'school-lab-revival',
    title: 'School Lab Revival',
    category: 'Technology',
    organization: 'FutureMinds Foundation',
    summary: 'Restoring school science labs with modern learning kits, laptops, and teacher training.',
    goalAmount: 38000,
    raisedAmount: 21400,
    image:
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'mobile-clinic-routes',
    title: 'Mobile Clinic Routes',
    category: 'Health',
    organization: 'CareLink Outreach',
    summary: 'Expanding mobile health units to deliver checkups and medicine to remote communities.',
    goalAmount: 62000,
    raisedAmount: 33900,
    image:
      'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'coastal-mangrove-shield',
    title: 'Coastal Mangrove Shield',
    category: 'Environment',
    organization: 'EcoTide Network',
    summary: 'Replanting mangroves to protect coastal villages from erosion and strengthen local biodiversity.',
    goalAmount: 52000,
    raisedAmount: 27120,
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'women-skill-hub',
    title: 'Women Skill Hub',
    category: 'Social Good',
    organization: 'Rise Together',
    summary: 'Launching practical vocational workshops and mentorship for women-led local businesses.',
    goalAmount: 28000,
    raisedAmount: 7400,
    image:
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'telehealth-kiosks',
    title: 'Telehealth Kiosks',
    category: 'Technology',
    organization: 'MedBridge Labs',
    summary: 'Deploying smart telehealth kiosks for quick remote consultations in underserved regions.',
    goalAmount: 76000,
    raisedAmount: 48950,
    image:
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'emergency-food-network',
    title: 'Emergency Food Network',
    category: 'Creative',
    organization: 'HandsOn Relief',
    summary: 'Building a rapid-response food distribution network for families during disaster recovery periods.',
    goalAmount: 34000,
    raisedAmount: 12980,
    image:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'community-tree-corridor',
    title: 'Community Tree Corridor',
    category: 'Environment',
    organization: 'Green Avenue Project',
    summary: 'Planting shade corridors along school and market routes to reduce heat and improve air quality.',
    goalAmount: 26000,
    raisedAmount: 19840,
    image:
      'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80',
  },
];

export function getCampaignById(id) {
  return campaigns.find((campaign) => campaign.id === id) ?? null;
}
