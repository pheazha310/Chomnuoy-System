import '../css/about.css';
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, TrendingUp, Eye, ShieldCheck, HandHeart, Users2 } from 'lucide-react';
import teamImage1 from '../../images/6129610942573121254_121.jpg';
import teamImage2 from '../../images/6129631399502351996_121.jpg';
import teamImage3 from '../../images/6147792428195319150_121.jpg';
import teamImage4 from '../../images/6147792428195319151_121.jpg';
import teamImage5 from '../../images/6147792428195319154_121.jpg';

// --- Mock Data ---

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

const CORE_VALUES = [
  {
    icon: Eye,
    title: 'Transparency',
    description: 'Every donation is tracked end-to-end, so you can clearly see where your support goes.'
  },
  {
    icon: ShieldCheck,
    title: 'Trust',
    description: 'We partner only with vetted organizations and verified projects for accountable delivery.'
  },
  {
    icon: HandHeart,
    title: 'Impact',
    description: 'Our focus is long-term, sustainable outcomes that uplift communities over time.'
  },
  {
    icon: Users2,
    title: 'Community',
    description: 'We bring donors, partners, and volunteers together to solve local challenges.'
  }
];

const TEAM = [
  {
    name: 'Sreyvik Von',
    role: 'Founder & CEO',
    bio: 'Passionate about using technology to close social impact gaps across Cambodia.',
    image: teamImage2
  },
  {
    name: 'Nita Chroun',
    role: 'Operations Director',
    bio: 'Ensuring every project is executed with precision, integrity, and measurable results.',
    image: teamImage1
  },
  {
    name: 'Sophea Phal',
    role: 'Product Manager',
    bio: 'Designing user-friendly donation flows that create trust and increase community impact.',
    image: teamImage3
  },
  {
    name: 'Ly Sarl',
    role: 'Partnership Lead',
    bio: 'Building strategic partnerships with NGOs, schools, and local leaders across regions.',
    image: teamImage4
  },
  {
    name: 'Seyha Ny',
    role: 'Community Relations',
    bio: 'Building trusted partnerships with communities and local organizations nationwide.',
    image: teamImage5
  }
];

// --- Components ---
// Note: this is the header section of the about page
const Hero = ({ donateHref }) => (
  <section className="about-hero">
    <div className="about-header-card">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="about-header-copy"
      >
        <div className="about-header-pill">
          <CheckCircle2 className="w-4 h-4" />
          Trusted by 150+ verified partners
        </div>
        <h1 className="about-header-title">
          Empower Communities,
          <br />
          <span>Change Lives.</span>
        </h1>
        <p className="about-header-desc">
          Join Chomnuoy to support impactful projects or start your own journey of giving. We connect compassionate donors with grassroots initiatives making a real difference.
        </p>
        <div className="about-header-actions">
          <Link to={donateHref} className="about-header-btn about-header-btn-primary group">
            Donate Now
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/campaigns" className="about-header-btn about-header-btn-secondary">
            Start a Campaign
          </Link>
        </div>
        <p className="about-header-meta">Joined by 10K+ active donors</p>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="about-header-media"
      >
        <div className="about-header-media-card">
          <img 
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cG9vciUyMHBlb3BsZXxlbnwwfHwwfHx8MA%3D%3D" 
            alt="Community support" 
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="about-header-media-tag">
            <span>LATEST SUCCESS</span>
            School supplies for 500 students in Siem Reap
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

function formatCompactCurrency(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return '$0';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number);
}

function formatCompactNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return '0';

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number);
}

function AboutStatCard({ stat, idx }) {
  const displayValue = stat.type === 'currency'
    ? formatCompactCurrency(stat.rawValue)
    : `${formatCompactNumber(stat.rawValue)}${stat.suffix || ''}`;

  return (
    <motion.div 
      key={stat.label}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: idx * 0.1 }}
      className="flex flex-col gap-2 rounded-2xl bg-white p-8 shadow-sm border border-slate-200 card-hover"
    >
      <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{stat.label}</p>
      <p className="text-4xl font-black text-slate-900">{displayValue}</p>
      <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
        <TrendingUp className="w-4 h-4" />
        {stat.change}
      </div>
    </motion.div>
  );
}

//Categorie total 

const Stats = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    let active = true;
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    Promise.allSettled([
      fetch(`${apiBase}/campaigns`).then((response) => (response.ok ? response.json() : [])),
      fetch(`${apiBase}/donations`).then((response) => (response.ok ? response.json() : [])),
      fetch(`${apiBase}/organizations`).then((response) => (response.ok ? response.json() : [])),
    ]).then(([campaignResult, donationResult, organizationResult]) => {
      if (!active) return;
      setCampaigns(campaignResult.status === 'fulfilled' && Array.isArray(campaignResult.value) ? campaignResult.value : []);
      setDonations(donationResult.status === 'fulfilled' && Array.isArray(donationResult.value) ? donationResult.value : []);
      setOrganizations(organizationResult.status === 'fulfilled' && Array.isArray(organizationResult.value) ? organizationResult.value : []);
    }).catch(() => {
      if (!active) return;
      setCampaigns([]);
      setDonations([]);
      setOrganizations([]);
    });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const completedDonations = donations.filter((item) => {
      const status = String(item.status || '').toLowerCase();
      return !status || status === 'completed' || status === 'confirmed';
    });
    const totalDonated = completedDonations.reduce((sum, item) => {
      if (String(item.donation_type || '').toLowerCase() === 'material') return sum;
      return sum + Number(item.amount || 0);
    }, 0);
    const verifiedPartners = organizations.filter((item) => {
      const status = String(item.verified_status || '').toLowerCase();
      return !status || ['verified', 'approved', 'active'].includes(status);
    }).length;
    const activeCampaigns = campaigns.filter((item) => String(item.status || '').toLowerCase() === 'active').length;
    const impactedLives = new Set(completedDonations.map((item) => Number(item.user_id)).filter(Boolean)).size
      + new Set(completedDonations.map((item) => Number(item.organization_id)).filter(Boolean)).size;

    return [
      { label: 'Total Donated', rawValue: totalDonated, type: 'currency', change: 'Live donation total' },
      { label: 'Verified Partners', rawValue: verifiedPartners, type: 'number', suffix: '+', change: 'Verified organizations' },
      { label: 'Impacted Lives', rawValue: impactedLives, type: 'number', suffix: '+', change: 'Based on real activity' },
      { label: 'Active Campaigns', rawValue: activeCampaigns, type: 'number', change: 'Currently running' },
    ];
  }, [campaigns, donations, organizations]);

  return (
    <section className="bg-slate-100/50 py-16 border-y border-slate-200">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <AboutStatCard key={stat.label} stat={stat} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};

const AboutContent = () => (
  <section className="about-content-sections">
    <div className="about-content-block">
      <h2>Our Story</h2>
      <p>
        Founded with the vision to bridge the gap between donors and those in need across Cambodia, Chomnuoy started
        as a small initiative to ensure that every contribution reaches its intended destination.
      </p>
      <p>
        We believe in the power of collective action to transform lives and strengthen communities. Through secure,
        verified, and transparent giving, we&apos;ve helped thousands of families access education, clean water, and healthcare.
      </p>
    </div>

    <div className="about-content-block about-values-block">
      <h2>Our Core Values</h2>
      <div className="about-values-grid">
        {CORE_VALUES.map((item) => (
          <div key={item.title} className="about-value-card">
            <item.icon className="w-5 h-5" />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="about-content-block about-team-block">
      <h2>Meet the Team</h2>
      <div className="about-team-grid about-team-grid-top">
        {TEAM.slice(0, 2).map((member) => (
          <div key={member.name} className="about-team-card">
            <img src={member.image} alt={member.name} referrerPolicy="no-referrer" />
            <h3>{member.name}</h3>
            <h4>{member.role}</h4>
            <p>{member.bio}</p>
          </div>
        ))}
      </div>
      <div className="about-team-grid about-team-grid-bottom">
        {TEAM.slice(2).map((member) => (
          <div key={member.name} className="about-team-card">
            <img src={member.image} alt={member.name} referrerPolicy="no-referrer" />
            <h3>{member.name}</h3>
            <h4>{member.role}</h4>
            <p>{member.bio}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Card of the organization 

const FeaturedOrgs = () => (
  <section className="mx-auto max-w-7xl px-6 py-24">
    <div className="relative mb-12 overflow-hidden rounded-[2.25rem] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 px-8 py-10 shadow-[0_24px_80px_rgba(37,99,235,0.12)]">
      <div className="pointer-events-none absolute inset-y-0 left-[8%] hidden w-64 rounded-full bg-sky-300/20 blur-3xl lg:block" />
      <div className="pointer-events-none absolute -right-16 top-10 hidden h-56 w-56 rounded-full bg-blue-300/20 blur-3xl lg:block" />
      <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-4 py-1 text-xs font-extrabold uppercase tracking-[0.28em] text-sky-700 shadow-sm">
              Trusted Partners
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 lg:text-5xl">
              Featured Organizations
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-600 lg:text-lg">
              Discover vetted organizations that are making real, measurable impact in their local communities.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-700">Verified NGOs</p>
              <p className="mt-3 text-3xl font-black text-slate-900">150+</p>
              <p className="mt-2 text-sm text-slate-500">Screened partners with transparent impact reporting.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-700">Active Causes</p>
              <p className="mt-3 text-3xl font-black text-slate-900">24</p>
              <p className="mt-2 text-sm text-slate-500">Education, health, climate, food security, and more.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-slate-900 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-300">Donor Trust</p>
              <p className="mt-3 text-3xl font-black text-white">4.9/5</p>
              <p className="mt-2 text-sm text-slate-300">Highly rated by supporters for clarity and delivery.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_18px_60px_rgba(148,163,184,0.18)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-500">Partner Snapshot</p>
              <h3 className="mt-3 text-2xl font-black text-slate-900">Organizations ready for impact</h3>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
              Live now
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {ORGANIZATIONS.map((org) => (
              <div
                key={org.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm transition-transform duration-300 hover:-translate-y-0.5"
              >
                <img
                  src={org.image}
                  alt={org.name}
                  className="h-16 w-16 rounded-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className={`inline-flex text-[11px] font-extrabold uppercase tracking-[0.2em] ${org.color}`}>
                    {org.category}
                  </div>
                  <h4 className="mt-1 truncate text-lg font-bold text-slate-900">{org.name}</h4>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{org.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-500/20">
            View All Organizations
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {ORGANIZATIONS.map((org, idx) => (
        <motion.div 
          key={org.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
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
              {/* <button className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-primary hover:text-white transition-all">
                Learn More
              </button> */}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default function AboutPage() {
  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const donateHref = session?.isLoggedIn ? '/campaigns' : '/login?redirect=%2Fcampaigns';

  return (
    <div className="h-screen w-screen flex flex-col selection:bg-primary/10 selection:text-primary">
      <main className="flex-grow overflow-auto">
        <Hero donateHref={donateHref} />
        <Stats />
        <AboutContent />
        <FeaturedOrgs />
      </main>
    </div>
  );
}
