import React from 'react';
import { motion } from 'framer-motion';
<<<<<<< HEAD
import { CheckCircle2, ArrowRight, Eye, ShieldCheck, HandHeart, Users2 } from 'lucide-react';
import '../css/about.css';
=======
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, TrendingUp, Eye, ShieldCheck, HandHeart, Users2 } from 'lucide-react';
import teamImage1 from '../../images/6129610942573121254_121.jpg';
import teamImage2 from '../../images/6129631399502351996_121.jpg';
import teamImage3 from '../../images/6147792428195319150_121.jpg';
import teamImage4 from '../../images/6147792428195319151_121.jpg';
import teamImage5 from '../../images/6147792428195319154_121.jpg';

// --- Mock Data ---
>>>>>>> bb0d46f7706715fbab7d3311bc669d505fdd8ad2

const STATS = [
  { label: 'Total Donated', value: '$2.4M', change: '+12% this month' },
  { label: 'Verified Partners', value: '150+', change: '+5% new partners' },
  { label: 'Impacted Lives', value: '50K+', change: '+18% growth' },
  { label: 'Active Campaigns', value: '85', change: '+10% active' },
];

const ORGANIZATIONS = [
  {
    id: 1,
    name: 'PNC',
    category: 'Education',
    description: 'Providing quality education and digital literacy programs to rural youth across the country.',
    image: 'https://cdn2.slideserve.com/4355656/slide1-n.jpg',
    donors: 12,
    color: 'text-primary',
  },
  {
    id: 2,
    name: 'AquaLife International',
    category: 'Environment',
    description: 'Building sustainable water infrastructure and purification systems for drought-affected regions.',
    image: 'https://www.borgenmagazine.com/wp-content/uploads/2020/08/Poor-People-Are-Happier-1.jpg',
    donors: 8,
    color: 'text-emerald-600',
  },
  {
    id: 3,
    name: 'Kantha Bopha',
    category: 'Health',
    description: 'Mobile clinics and professional medical care for underserved communities without hospital access.',
    image: 'https://i.ytimg.com/vi/bgPZU9rb4kc/maxresdefault.jpg',
    donors: 24,
    color: 'text-rose-600',
  },
];

const CORE_VALUES = [
  {
    icon: Eye,
    title: 'Transparency',
    description: 'Every donation is tracked end-to-end, so you can clearly see where your support goes.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust',
    description: 'We partner only with vetted organizations and verified projects for accountable delivery.',
  },
  {
    icon: HandHeart,
    title: 'Impact',
    description: 'Our focus is long-term, sustainable outcomes that uplift communities over time.',
  },
  {
    icon: Users2,
    title: 'Community',
    description: 'We bring donors, partners, and volunteers together to solve local challenges.',
  },
];

const TEAM = [
  {
    name: 'Sreyvik Von',
    role: 'Founder & CEO',
    bio: 'Passionate about using technology to close social impact gaps across Cambodia.',
<<<<<<< HEAD
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
=======
    image: teamImage2
>>>>>>> bb0d46f7706715fbab7d3311bc669d505fdd8ad2
  },
  {
    name: 'Nita Chroun',
    role: 'Operations Director',
    bio: 'Ensuring every project is executed with precision, integrity, and measurable results.',
<<<<<<< HEAD
    image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80',
=======
    image: teamImage1
>>>>>>> bb0d46f7706715fbab7d3311bc669d505fdd8ad2
  },
  {
    name: 'Sophea Phal',
    role: 'Product Manager',
    bio: 'Designing user-friendly donation flows that create trust and increase community impact.',
<<<<<<< HEAD
    image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80',
=======
    image: teamImage3
>>>>>>> bb0d46f7706715fbab7d3311bc669d505fdd8ad2
  },
  {
    name: 'Ly Sarl',
    role: 'Partnership Lead',
    bio: 'Building strategic partnerships with NGOs, schools, and local leaders across regions.',
<<<<<<< HEAD
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
=======
    image: teamImage4
>>>>>>> bb0d46f7706715fbab7d3311bc669d505fdd8ad2
  },
  {
    name: 'Seyha Ny',
    role: 'Community Relations',
    bio: 'Building trusted partnerships with communities and local organizations nationwide.',
<<<<<<< HEAD
    image: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=400&q=80',
  },
=======
    image: teamImage5
  }
>>>>>>> bb0d46f7706715fbab7d3311bc669d505fdd8ad2
];

const Hero = () => (
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
          Join Chomnuoy to support impactful projects or start your own journey of giving. We connect compassionate
          donors with grassroots initiatives making a real difference.
        </p>
        <div className="about-header-actions">
          <Link to="/login" className="about-header-btn about-header-btn-primary group">
            Donate Now
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
<<<<<<< HEAD
          </button>
          <button className="about-header-btn about-header-btn-secondary">Start a Campaign</button>
=======
          </Link>
          <Link to="/campaigns" className="about-header-btn about-header-btn-secondary">
            Start a Campaign
          </Link>
>>>>>>> bb0d46f7706715fbab7d3311bc669d505fdd8ad2
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

const Stats = () => (
  <section className="bg-slate-100/50 py-16 border-y border-slate-200">
    <div className="mx-auto max-w-7xl px-6">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2 rounded-2xl bg-white p-8 shadow-sm border border-slate-200 card-hover">
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

const FeaturedOrgs = () => (
  <section className="mx-auto max-w-7xl px-6 py-24">
    <div className="flex items-end justify-between mb-12">
      <div className="max-w-xl">
        <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl mb-6">Featured Organizations</h2>
        <p className="mt-4 text-white max-w-2xl mx-auto">
          Discover vetted organizations that are making real measurable impact in their local communities.
        </p>
      </div>
      <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xl text-primary hover:text-white hover:border-primary transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-primary/25 transform hover:-translate-y-0.5 whitespace-nowrap mb-4">
        View All Organizations
        <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
      </button>
    </div>
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {ORGANIZATIONS.map((org, idx) => (
        <div key={org.id} className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg border border-slate-100 card-hover">
          <div className="aspect-video w-full overflow-hidden">
            <img src={org.image} alt={org.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
          </div>
          <div className="flex flex-1 flex-col p-6">
            <div className={`mb-2 inline-flex text-xs font-bold uppercase tracking-tighter ${org.color}`}>{org.category}</div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">{org.name}</h3>
            <p className="mb-6 text-sm text-slate-600 line-clamp-2">{org.description}</p>
            <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://picsum.photos/seed/donor${i + idx}/32/32`} alt="Donor" referrerPolicy="no-referrer" />
                  </div>
                ))}
                <div className="h-8 w-8 rounded-full border-2 border-white bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                  +{org.donors}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default function AboutPage() {
  return (
    <div className="h-screen w-screen flex flex-col selection:bg-primary/10 selection:text-primary">
      <main className="flex-grow overflow-auto">
        <Hero />
        <Stats />
        <AboutContent />
        <FeaturedOrgs />
      </main>
    </div>
  );
}
