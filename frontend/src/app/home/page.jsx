import { useEffect, useMemo, useState } from 'react';
import './home.css';
import { Link } from 'react-router-dom';
import Map from './map';
import { CAMPAIGN_FALLBACK_IMAGE, fetchCampaigns } from '@/services/campaign-service.js';
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

function getCauseTone(value) {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'education' || key === 'community') return 'green';
  if (key === 'medical' || key === 'disaster relief') return 'red';
  return 'blue';
}

function shortenText(value, maxLength = 140) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return 'Support a verified cause making a measurable difference in local communities.';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function useCountUp(targetValue, duration = 1200) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Math.max(0, Number(targetValue || 0));
    if (!Number.isFinite(target)) {
      setDisplayValue(0);
      return undefined;
    }

    let frameId = null;
    let startTime = null;

    const step = (timestamp) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - ((1 - progress) * (1 - progress) * (1 - progress));
      setDisplayValue(target * eased);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      }
    };

    setDisplayValue(0);
    frameId = window.requestAnimationFrame(step);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [duration, targetValue]);

  return displayValue;
}

function formatAnimatedStat(type, value) {
  const numericValue = Math.max(0, Number(value || 0));

  if (type === 'currency') {
    return formatCompactCurrency(numericValue);
  }

  return `${formatCompactNumber(numericValue)}+`;
}

function HomeStat({ item }) {
  const animatedValue = useCountUp(item.rawValue);

  return (
    <article data-reveal style={{ '--reveal-delay': item.delay }}>
      <p>{formatAnimatedStat(item.type, animatedValue)}</p>
      <span>{item.label}</span>
    </article>
  );
}

function Home() {
  const session = getSession();
  const donateHref = session?.isLoggedIn ? '/campaigns/donor' : '/login?redirect=%2Fcampaigns';
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    setCampaignsLoading(true);
    Promise.allSettled([
      fetchCampaigns(),
      fetch(`${apiBase}/donations`).then((response) => (response.ok ? response.json() : [])),
      fetch(`${apiBase}/organizations`).then((response) => (response.ok ? response.json() : [])),
    ])
      .then(([campaignResult, donationResult, organizationResult]) => {
        if (!active) return;
        setCampaigns(campaignResult.status === 'fulfilled' ? campaignResult.value : []);
        setDonations(donationResult.status === 'fulfilled' && Array.isArray(donationResult.value) ? donationResult.value : []);
        setOrganizations(organizationResult.status === 'fulfilled' && Array.isArray(organizationResult.value) ? organizationResult.value : []);
      })
      .catch(() => {
        if (!active) return;
        setCampaigns([]);
        setDonations([]);
        setOrganizations([]);
      })
      .finally(() => {
        if (!active) return;
        setCampaignsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const activeProjects = campaigns.filter((item) => String(item.status || '').toLowerCase() === 'active').length;
    const completedDonations = donations.filter((item) => {
      const status = String(item.status || '').toLowerCase();
      return !status || status === 'completed' || status === 'confirmed';
    });
    const totalDonated = completedDonations.reduce((sum, item) => {
      if (String(item.donation_type || '').toLowerCase() === 'material') return sum;
      return sum + Number(item.amount || 0);
    }, 0);
    const uniqueDonors = new Set(completedDonations.map((item) => Number(item.user_id)).filter(Boolean)).size;
    const uniqueOrganizations = new Set(completedDonations.map((item) => Number(item.organization_id)).filter(Boolean)).size;
    const livesTouched = uniqueDonors + uniqueOrganizations;

    return [
      { rawValue: totalDonated, type: 'currency', label: 'Total donated', delay: '100ms' },
      { rawValue: livesTouched, type: 'number', label: 'Lives touched', delay: '190ms' },
      { rawValue: activeProjects, type: 'number', label: 'Active projects', delay: '280ms' },
    ];
  }, [campaigns, donations]);

  const featuredCauses = useMemo(() => {
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
          summary: shortenText(item.summary, 150),
          raised: formatCompactCurrency(item.raisedAmount),
          goal: formatCompactCurrency(item.goalAmount),
          progress,
          tag: item.normalizedCategory,
          tone: getCauseTone(item.normalizedCategory),
          organization: item.organization,
          timeLeft: item.timeLeft,
          image: item.image || CAMPAIGN_FALLBACK_IMAGE,
        };
      });
  }, [campaigns]);

  const trustedPartners = useMemo(() => {
    const verifiedOrganizations = organizations
      .filter((item) => {
        const status = String(item.verified_status || item.status || '').toLowerCase();
        return !status || status.includes('verified') || status.includes('approved') || status.includes('active');
      })
      .slice(0, 5)
      .map((item) => item.name)
      .filter(Boolean);

    return verifiedOrganizations.length > 0
      ? verifiedOrganizations
      : ['Verified NGOs', 'Health Relief', 'Education Funds', 'Community Care', 'Emergency Aid'];
  }, [organizations]);

  const ctaMetrics = useMemo(() => {
    const verifiedOrganizations = organizations.filter((item) => {
      const status = String(item.verified_status || item.status || '').toLowerCase();
      return !status || status.includes('verified') || status.includes('approved') || status.includes('active');
    }).length;

    const completedDonations = donations.filter((item) => {
      const status = String(item.status || '').toLowerCase();
      return !status || status === 'completed' || status === 'confirmed';
    }).length;

    const activeCampaigns = campaigns.filter((item) => String(item.status || '').toLowerCase() === 'active').length;

    return [
      { label: 'Verified organizations', value: formatCompactNumber(verifiedOrganizations) },
      { label: 'Completed donations', value: formatCompactNumber(completedDonations) },
      { label: 'Active campaigns', value: formatCompactNumber(activeCampaigns) },
    ];
  }, [campaigns, donations, organizations]);

  const ctaSummary = useMemo(() => {
    const totalRaised = donations.reduce((sum, item) => {
      const status = String(item.status || '').toLowerCase();
      const isMaterial = String(item.donation_type || '').toLowerCase() === 'material';
      if (isMaterial || (status && status !== 'completed' && status !== 'confirmed')) return sum;
      return sum + Number(item.amount || 0);
    }, 0);

    const leadCause = featuredCauses[0];

    return {
      totalRaised: formatCompactCurrency(totalRaised),
      featuredTitle: leadCause?.title || 'New community campaigns launching now',
      featuredProgress: leadCause ? `${leadCause.progress}% funded` : 'Fresh opportunities for donors and organizations',
    };
  }, [donations, featuredCauses]);

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
  }, [campaignsLoading, featuredCauses.length]);

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
          {stats.map((item) => (
            <HomeStat key={item.label} item={item} />
          ))}
        </section>

      <section className="home-featured" aria-labelledby="featured-title" data-reveal>
        <div className="home-section-head">
          <h2 id="featured-title">Featured Causes</h2>
          <Link to="/campaigns">View All Causes</Link>
        </div>
        <div className="home-cards-grid">
          {campaignsLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <article
                  key={`featured-skeleton-${index}`}
                  className="home-cause-card home-cause-card-skeleton"
                  aria-hidden="true"
                  data-reveal
                  style={{ '--reveal-delay': `${150 + index * 100}ms` }}
                >
                  <div className="home-cause-media home-cause-media-skeleton" />
                  <div className="home-cause-body">
                    <span className="home-skeleton-line home-skeleton-line-title" />
                    <span className="home-skeleton-line home-skeleton-line-text" />
                    <span className="home-skeleton-line home-skeleton-line-text short" />
                    <div className="home-cause-amounts">
                      <span className="home-skeleton-line home-skeleton-line-amount" />
                      <span className="home-skeleton-line home-skeleton-line-goal" />
                    </div>
                    <div className="home-progress home-progress-skeleton" />
                  </div>
                </article>
              ))
            : null}

          {!campaignsLoading && featuredCauses.length === 0 ? (
            <article className="home-featured-empty" data-reveal>
              <span className="home-featured-empty-kicker">Featured campaigns</span>
              <h3>No public causes available yet</h3>
              <p>
                Campaigns from verified organizations will appear here once they are published. Explore all campaigns
                or return later for new causes.
              </p>
              <div className="home-featured-empty-actions">
                <Link to="/campaigns" className="home-btn home-btn-primary">
                  Browse Campaigns
                </Link>
                <Link to="/organizations" className="home-btn home-btn-secondary">
                  Explore Organizations
                </Link>
              </div>
            </article>
          ) : null}

          {!campaignsLoading
            ? featuredCauses.map((cause, index) => (
                <article
                  key={cause.id}
                  className="home-cause-card"
                  data-reveal
                  style={{ '--reveal-delay': `${150 + index * 100}ms` }}
                >
                  <div
                    className={`home-cause-media ${cause.tone}`}
                    style={{ backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.45)), url('${cause.image}')` }}
                  >
                    <span>{cause.tag}</span>
                    <small>{cause.timeLeft}</small>
                  </div>
                  <div className="home-cause-body">
                    <p className="home-cause-org">{cause.organization}</p>
                    <h3>{cause.title}</h3>
                    <p>{cause.summary}</p>
                    <div className="home-cause-amounts">
                      <strong>{cause.raised}</strong>
                      <span>of {cause.goal}</span>
                    </div>
                    <div className="home-progress" role="img" aria-label={`${cause.progress}% funded`}>
                      <span style={{ width: `${cause.progress}%` }} />
                    </div>
                    <Link to={`/campaigns/${cause.id}`} className="home-cause-link">
                      View campaign
                    </Link>
                  </div>
                </article>
              ))
            : null}
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
        <p>Trusted by active partners on Chomnuoy</p>
        <div className="home-trusted-list">
          {trustedPartners.map((org, index) => (
            <span key={org} data-reveal style={{ '--reveal-delay': `${160 + index * 60}ms` }}>
              {org}
            </span>
          ))}
        </div>
      </section>

      <section className="home-cta" aria-labelledby="cta-title" data-reveal>
        <div className="home-cta-copy">
          <span className="home-cta-kicker">Platform momentum</span>
          <h2 id="cta-title">Turn generosity into visible progress.</h2>
          <p>
            Support verified organizations, fund live campaigns, and track a platform that has already moved {ctaSummary.totalRaised} in support.
          </p>
          <div className="home-hero-actions">
            <Link to="/campaigns" className="home-btn home-btn-light">
              Explore Live Campaigns
            </Link>
            <Link to="/organizations" className="home-btn home-btn-outline-light">
              Browse Organizations
            </Link>
          </div>
        </div>

        <div className="home-cta-panel">
          <div className="home-cta-panel-head">
            <strong>{ctaSummary.featuredTitle}</strong>
            <span>{ctaSummary.featuredProgress}</span>
          </div>
          <div className="home-cta-metrics">
            {ctaMetrics.map((item) => (
              <article key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
          <Link to="/contact" className="home-cta-support-link">
            Contact Support
          </Link>
        </div>
      </section>
      <Map />
    </main>
  );
}

export default Home;
