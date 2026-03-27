import { useEffect, useMemo, useState } from 'react';
import './home.css';
import { Link } from 'react-router-dom';
import Map from './map';
import { fetchCampaigns } from '@/services/campaign-service.js';
import { getSession } from '@/services/session-service.js';

const howItWorks = {
  donors: [
    { title: 'Browse Projects', text: 'Explore verified causes in education, environment, health, and more.' },
    { title: 'Give Securely', text: 'Donate through trusted channels with transparent progress updates.' },
    { title: 'Track Impact', text: 'Receive milestone updates that show how your contribution helps.' },
  ],
  organizations: [
    { title: 'Create Campaigns', text: 'Set clear goals and timelines to present your mission effectively.' },
    { title: 'Share & Engage', text: 'Reach supporters and keep your community informed with updates.' },
    { title: 'Receive Funds', text: 'Fast, transparent fund disbursement to start delivering impact.' },
  ],
};

const trustedBy = ['UNICEF', 'Red Cross', 'WWF', 'CARE', 'OXFAM'];

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

function Home() {
  const session = getSession();
  const donateHref = session?.isLoggedIn ? '/campaigns/donor' : '/login?redirect=%2Fcampaigns';
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    let active = true;

    fetchCampaigns()
      .then((items) => {
        if (!active) return;
        setCampaigns(items);
      })
      .catch(() => {
        if (!active) return;
        setCampaigns([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalDonated = campaigns.reduce((sum, item) => sum + Number(item.raisedAmount || 0), 0);
    const totalGoal = campaigns.reduce((sum, item) => sum + Number(item.goalAmount || 0), 0);
    const activeProjects = campaigns.length;
    const livesTouched = Math.max(activeProjects * 120, Math.round(totalDonated / 18));

    return [
      { value: formatCompactCurrency(totalDonated || totalGoal), label: 'Total donated' },
      { value: `${Math.max(0, livesTouched).toLocaleString()}+`, label: 'Lives touched' },
      { value: `${activeProjects.toLocaleString()}+`, label: 'Active projects' },
    ];
  }, [campaigns]);

  const featuredCauses = useMemo(() => {
    const toneByCategory = {
      Environment: 'blue',
      Education: 'green',
      Medical: 'red',
      'Disaster Relief': 'red',
      Community: 'green',
      General: 'blue',
    };

    return campaigns
      .slice()
      .sort((a, b) => {
        const progressA = a.goalAmount ? a.raisedAmount / a.goalAmount : 0;
        const progressB = b.goalAmount ? b.raisedAmount / b.goalAmount : 0;
        return progressB - progressA;
      })
      .slice(0, 3)
      .map((item) => {
        const progress = item.goalAmount ? Math.min(100, Math.round((item.raisedAmount / item.goalAmount) * 100)) : 0;
        return {
          id: item.id,
          title: item.title,
          summary: item.summary,
          raised: formatCompactCurrency(item.raisedAmount),
          goal: formatCompactCurrency(item.goalAmount),
          progress,
          tag: item.normalizedCategory,
          tone: toneByCategory[item.normalizedCategory] || 'blue',
        };
      });
  }, [campaigns]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = Array.from(document.querySelectorAll('[data-reveal]'));
    const heroVisual = document.querySelector('.home-hero-visual');
    const heroSection = document.querySelector('.home-hero');
    let rafId = null;

    if (prefersReducedMotion) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );

    elements.forEach((element) => observer.observe(element));

    const onMouseMove = (event) => {
      if (!heroVisual || !heroSection) return;
      const bounds = heroSection.getBoundingClientRect();
      const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        heroVisual.style.setProperty('--tilt-x', `${relativeY * -5}deg`);
        heroVisual.style.setProperty('--tilt-y', `${relativeX * 7}deg`);
        heroVisual.style.setProperty('--float-x', `${relativeX * 12}px`);
        heroVisual.style.setProperty('--float-y', `${relativeY * 10}px`);
      });
    };

    const onMouseLeave = () => {
      if (!heroVisual) return;
      heroVisual.style.setProperty('--tilt-x', '0deg');
      heroVisual.style.setProperty('--tilt-y', '0deg');
      heroVisual.style.setProperty('--float-x', '0px');
      heroVisual.style.setProperty('--float-y', '0px');
    };

    heroSection?.addEventListener('mousemove', onMouseMove);
    heroSection?.addEventListener('mouseleave', onMouseLeave);

    return () => {
      observer.disconnect();
      heroSection?.removeEventListener('mousemove', onMouseMove);
      heroSection?.removeEventListener('mouseleave', onMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <main className="home-page-body">
      <section className="home-hero" aria-labelledby="home-title" data-reveal>
        <div className="home-hero-copy">
          <h1 id="home-title">
            Empower Communities,
            <span> Change Lives.</span>
          </h1>
          <p>
            Join Chomnuoy to support impactful projects, help trusted organizations, and bring lasting change to
            communities in need.
          </p>
          <div className="home-hero-actions">
            <Link to={donateHref} className="home-btn home-btn-primary">
              Donate Now
            </Link>
            <Link to="/organizations" className="home-btn home-btn-secondary">
              Explore Organizations
            </Link>
          </div>
          <p className="home-meta">Active in 18+ provinces with verified local partners.</p>
        </div>

        <div className="home-hero-visual" aria-hidden="true">
          <div className="home-hero-art" />
        </div>
      </section>

      <section className="home-stats" aria-label="Platform stats" data-reveal>
        {stats.map((item, index) => (
          <article key={item.label} data-reveal style={{ '--reveal-delay': `${100 + index * 90}ms` }}>
            <p>{item.value}</p>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="home-featured" aria-labelledby="featured-title" data-reveal>
        <div className="home-section-head">
          <h2 id="featured-title">Featured Causes</h2>
          <Link to="/campaigns">View All Causes</Link>
        </div>
        <div className="home-cards-grid">
          {featuredCauses.map((cause, index) => (
            <article
              key={cause.id}
              className="home-cause-card"
              data-reveal
              style={{ '--reveal-delay': `${150 + index * 100}ms` }}
            >
              <div className={`home-cause-media ${cause.tone}`}>
                <span>{cause.tag}</span>
              </div>
              <div className="home-cause-body">
                <h3>{cause.title}</h3>
                <p>{cause.summary}</p>
                <div className="home-cause-amounts">
                  <strong>{cause.raised}</strong>
                  <span>of {cause.goal}</span>
                </div>
                <div className="home-progress" role="img" aria-label={`${cause.progress}% funded`}>
                  <span style={{ width: `${cause.progress}%` }} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-how" aria-labelledby="how-title" data-reveal>
        <h2 id="how-title">How Chomnuoy Works</h2>
        <p>Simple, transparent steps for donors and organizations to create meaningful impact together.</p>

        <div className="home-how-grid">
          <article data-reveal style={{ '--reveal-delay': '180ms' }}>
            <div className="home-how-card-head">
              <span className="home-how-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img">
                  <circle cx="8" cy="8" r="3" />
                  <circle cx="16" cy="9" r="2.5" />
                  <path d="M3.5 18c0-2.7 2.2-4.9 4.9-4.9h1.1c2.7 0 4.9 2.2 4.9 4.9" />
                  <path d="M13.5 18c0-2 1.6-3.6 3.6-3.6h.5c2 0 3.6 1.6 3.6 3.6" />
                </svg>
              </span>
              <h3>For Donors</h3>
            </div>
            <ul>
              {howItWorks.donors.map((item, index) => (
                <li key={item.title}>
                  <span className="home-how-step-num">{index + 1}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article data-reveal style={{ '--reveal-delay': '260ms' }}>
            <div className="home-how-card-head">
              <span className="home-how-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img">
                  <rect x="5" y="4" width="14" height="16" rx="2" />
                  <path d="M9 8h2v2H9zM13 8h2v2h-2zM9 12h2v2H9zM13 12h2v2h-2z" />
                  <path d="M10 4h4" />
                </svg>
              </span>
              <h3>For Organizations</h3>
            </div>
            <ul>
              {howItWorks.organizations.map((item, index) => (
                <li key={item.title}>
                  <span className="home-how-step-num">{index + 1}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="home-trusted" aria-label="Trusted organizations" data-reveal>
        <p>Trusted by global organizations</p>
        <div>
          {trustedBy.map((org, index) => (
            <span key={org} data-reveal style={{ '--reveal-delay': `${160 + index * 60}ms` }}>
              {org}
            </span>
          ))}
        </div>
      </section>

      <section className="home-cta" aria-labelledby="cta-title" data-reveal>
        <h2 id="cta-title">Ready to make a difference?</h2>
        <p>Whether you want to give or start a campaign, Chomnuoy is here to support your journey.</p>
        <div className="home-hero-actions">
          <Link to="/campaigns" className="home-btn home-btn-light">
            Start Your Journey
          </Link>
          <Link to="/contact" className="home-btn home-btn-outline-light">
            Contact Support
          </Link>
        </div>
      </section>
      <Map />
    </main>
  );
}

export default Home;
