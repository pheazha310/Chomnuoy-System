import '../css/about.css';
import React from 'react';

// --- Mock Data ---

const STATS = [
  { label: 'Total Donated', value: '$2.4M', change: '+12% this month', trend: 'up' },
  { label: 'Verified Partners', value: '150+', change: '+5% new partners', trend: 'up' },
  { label: 'Impacted Lives', value: '50K+', change: '+18% growth', trend: 'up' },
  { label: 'Active Campaigns', value: '85', change: '+10% active', trend: 'up' },
];

const ORGANIZATIONS = [
  {
    id: 1,
    name: 'PNC',
    category: 'Education',
    description: 'Providing quality education and digital literacy programs to rural youth across the country.',
    image: 'https://cdn2.slideserve.com/4355656/slide1-n.jpg',
    donors: 12,
    color: 'text-primary'
  },
  {
    id: 2,
    name: 'AquaLife International',
    category: 'Environment',
    description: 'Building sustainable water infrastructure and purification systems for drought-affected regions.',
    image: 'https://www.borgenmagazine.com/wp-content/uploads/2020/08/Poor-People-Are-Happier-1.jpg',
    donors: 8,
    color: 'text-emerald-600'
  },
  {
    id: 3,
    name: 'Kantha Bopha',
    category: 'Health',
    description: 'Mobile clinics and professional medical care for underserved communities without hospital access.',
    image: 'https://i.ytimg.com/vi/bgPZU9rb4kc/maxresdefault.jpg',
    donors: 24,
    color: 'text-rose-600'
  }
];

// --- Components ---
// Note: this is the header section of the about page
const Hero = () => (
  <section className="about-hero mx-auto max-w-9xl px-0 py-8 lg:py-24">
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center" style={{background:"white", padding:'30px', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'space-between',width:'100%',margin:'0 auto'}}>
      <div className="flex flex-col gap-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <span aria-hidden="true">✓</span>
          Trusted by 150+ Verified Partners
        </div>
        <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-slate-900 lg:text-7xl">
          Empowering Communities Through <span className="text-primary">Collective Giving</span>
        </h1>
        <p className="text-lg leading-relaxed text-slate-600 max-w-lg">
          Join Chomnuoy in supporting verified grassroots organizations making a real difference. Your contribution creates lasting impact where it's needed most.
        </p>
        <div className="flex flex-wrap gap-4" style={{display:'flex', gap:'20px'}}>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all group ">
            Explore Causes
            <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
          </button>
          <button className="rounded-xl bg-white border border-slate-200 px-8 py-4 text-base font-bold text-slate-900 hover:bg-slate-50 transition-all">
            Start Donating
          </button>
        </div>
      </div>
      <div className="relative group">
        <div className="absolute -inset-4 rounded-2xl bg-gradient-to-tr from-primary/20 to-transparent blur-2xl group-hover:from-primary/30 transition-all"></div>
        <div className="relative aspect-[4/2] overflow-hidden rounded-2xl shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cG9vciUyMHBlb3BsZXxlbnwwfHwwfHx8MA%3D%3D" 
            alt="Community support" 
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '25%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      </div>
    </div>
  </section>
);

const Stats = () => (
  <section className="bg-slate-100/50 py-16 border-y border-slate-200">
    <div className="mx-auto max-w-7xl px-6">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {STATS.map((stat, idx) => (
          <div
            key={stat.label}
            className="flex flex-col gap-2 rounded-2xl bg-white p-8 shadow-sm border border-slate-200 card-hover"
          >
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            <p className="text-4xl font-black text-slate-900">{stat.value}</p>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
              <span aria-hidden="true">↗</span>
              {stat.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FeaturedOrgs = () => (
  <section className="mx-auto max-w-7xl px-6 py-24">
    <div className="flex items-end justify-between mb-12">
      <div className="max-w-xl">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">Featured Organizations</h2>
        <p className="mt-4 text-slate-600">Discover vetted organizations that are making real measurable impact in their local communities.</p>
      </div>
      <button className="hidden md:flex items-center gap-2 text-primary font-bold hover:underline group">
        View All Organizations
        <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
      </button>
    </div>
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {ORGANIZATIONS.map((org, idx) => (
        <div
          key={org.id}
          className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg border border-slate-100 card-hover"
        >
          <div className="aspect-video w-full overflow-hidden">
            <img 
              src={org.image} 
              alt={org.name} 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-1 flex-col p-6">
            <div className={`mb-2 inline-flex text-xs font-bold uppercase tracking-tighter ${org.color}`}>
              {org.category}
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">{org.name}</h3>
            <p className="mb-6 text-sm text-slate-600 line-clamp-2">{org.description}</p>
            <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://picsum.photos/seed/donor${i+idx}/32/32`} alt="Donor" referrerPolicy="no-referrer" />
                  </div>
                ))}
                <div className="h-8 w-8 rounded-full border-2 border-white bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                  +{org.donors}
                </div>
              </div>
              <button className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-primary hover:text-white transition-all">
                Learn More
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-primary/10 selection:text-primary">
      <main className="flex-grow">
        <Hero />
        <Stats />
        <FeaturedOrgs />
      </main>
    </div>
  );
}
