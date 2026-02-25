import './home.css';

const stats = [
  { value: '$2.5M+', label: 'Total donated' },
  { value: '150K+', label: 'Lives touched' },
  { value: '450+', label: 'Active projects' },
];

const featuredCauses = [
  {
    title: 'Clean Water for Rural Villages',
    summary: 'Providing sustainable water systems to remote communities with urgent health needs.',
    raised: '$15,000',
    goal: '$22,000',
    progress: 68,
    tag: 'Environment',
    tone: 'blue',
  },
  {
    title: 'Digital Literacy for Youth',
    summary: 'Equipping students with computer labs, skills training, and mentorship programs.',
    raised: '$9,400',
    goal: '$22,000',
    progress: 42,
    tag: 'Education',
    tone: 'green',
  },
  {
    title: 'Mobile Clinics for Remote Areas',
    summary: 'Bringing essential healthcare services to families beyond local clinic coverage.',
    raised: '$20,500',
    goal: '$22,000',
    progress: 93,
    tag: 'Health',
    tone: 'red',
  },
];

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

function Home() {
  return (
    <main className="home-page-body">
      <section className="home-hero" aria-labelledby="home-title">
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
            <a href="/campaigns" className="home-btn home-btn-primary">
              Donate Now
            </a>
            <a href="/campaigns" className="home-btn home-btn-secondary">
              Start a Campaign
            </a>
          </div>
          <p className="home-meta">Active in 18+ provinces with verified local partners.</p>
        </div>

        <div className="home-hero-visual" aria-hidden="true">
          <div className="home-hero-art">
            <div className="art-card art-one" />
            <div className="art-card art-two" />
            <div className="art-card art-three" />
          </div>
          <div className="home-impact-card">
            <p>Latest Success</p>
            <strong>School Supplies for 560 Students</strong>
          </div>
        </div>
      </section>

      <section className="home-stats" aria-label="Platform stats">
        {stats.map((item) => (
          <article key={item.label}>
            <p>{item.value}</p>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="home-featured" aria-labelledby="featured-title">
        <div className="home-section-head">
          <h2 id="featured-title">Featured Causes</h2>
          <a href="/campaigns">View All Causes</a>
        </div>
        <div className="home-cards-grid">
          {featuredCauses.map((cause) => (
            <article key={cause.title} className="home-cause-card">
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

      <section className="home-how" aria-labelledby="how-title">
        <h2 id="how-title">How Chomnuoy Works</h2>
        <p>Simple, transparent steps for donors and organizations to create meaningful impact together.</p>

        <div className="home-how-grid">
          <article>
            <h3>For Donors</h3>
            <ul>
              {howItWorks.donors.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </article>

          <article>
            <h3>For Organizations</h3>
            <ul>
              {howItWorks.organizations.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="home-trusted" aria-label="Trusted organizations">
        <p>Trusted by global organizations</p>
        <div>
          {trustedBy.map((org) => (
            <span key={org}>{org}</span>
          ))}
        </div>
      </section>

      <section className="home-cta" aria-labelledby="cta-title">
        <h2 id="cta-title">Ready to make a difference?</h2>
        <p>Whether you want to give or start a campaign, Chomnuoy is here to support your journey.</p>
        <div className="home-hero-actions">
          <a href="/campaigns" className="home-btn home-btn-light">
            Start Your Journey
          </a>
          <a href="#" className="home-btn home-btn-outline-light">
            Contact Support
          </a>
        </div>
      </section>
    </main>
  );
}

export default Home;
