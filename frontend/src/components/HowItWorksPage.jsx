import './css/HowItWorks.css';

const heroStats = [
  { value: '4 Steps', label: 'Simple process' },
  { value: '100%', label: 'Transparent milestones' },
  { value: '24/7', label: 'Campaign visibility' },
];

const steps = [
  {
    title: 'Plan Your Campaign',
    description:
      'Define the goal, timeline, budget, and expected outcomes so supporters know exactly what you are delivering.',
  },
  {
    title: 'Submit For Verification',
    description:
      'Organization and campaign details are reviewed to ensure legitimacy, clarity, and donor confidence before launch.',
  },
  {
    title: 'Launch And Promote',
    description:
      'Go live and share your campaign across social channels, communities, and partner networks to gather momentum.',
  },
  {
    title: 'Deliver And Report',
    description:
      'Post updates, evidence, and milestone reports so every supporter sees where funding goes and what changed.',
  },
];

const lanes = [
  {
    title: 'For Campaign Creators',
    points: [
      'Create campaign with clear goals and visuals',
      'Respond to supporter questions quickly',
      'Publish milestone updates on time',
    ],
  },
  {
    title: 'For Supporters',
    points: [
      'Browse verified campaigns by category',
      'Check funding progress before donating',
      'Track real outcomes after contribution',
    ],
  },
  {
    title: 'For Organizations',
    points: [
      'Manage multiple campaigns in one place',
      'Use reports to show impact transparency',
      'Build long-term community trust',
    ],
  },
];

const faqs = [
  {
    question: 'How long does verification take?',
    answer: 'Most campaigns are reviewed within 24 to 72 hours depending on document completeness.',
  },
  {
    question: 'Can I edit my campaign after launch?',
    answer: 'Yes. You can update description, milestones, and media while keeping donation history unchanged.',
  },
  {
    question: 'How do supporters know updates are real?',
    answer: 'Updates are attached to the campaign timeline and should include details, photos, and milestone evidence.',
  },
];

function HowItWorksPage() {
  return (
    <main className="how-page">
      <section className="how-hero">
        <div className="how-hero-copy">
          <p className="how-eyebrow">How It Works</p>
          <h1>Turn community needs into verified, trackable impact.</h1>
          <p>
            Chomnuoy gives campaign creators, organizations, and supporters one clear workflow from idea to measurable
            delivery.
          </p>
          <div className="how-hero-actions">
            <a href="/campaigns" className="how-btn how-btn-primary">
              Explore Campaigns
            </a>
            <a href="#" className="how-btn how-btn-secondary">
              Start A Campaign
            </a>
          </div>
        </div>

        <div className="how-hero-stats" aria-label="How it works highlights">
          {heroStats.map((item) => (
            <article key={item.label} className="how-stat-card">
              <p className="how-stat-value">{item.value}</p>
              <p className="how-stat-label">{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section-head">
        <p className="section-kicker">Workflow</p>
        <h2>The Campaign Journey</h2>
      </section>

      <section className="how-steps" aria-label="How it works steps">
        {steps.map((step, index) => (
          <article key={step.title} className="how-step-card">
            <p className="how-step-number">0{index + 1}</p>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </section>

      <section className="how-section-head">
        <p className="section-kicker">By Role</p>
        <h2>Who Does What</h2>
      </section>

      <section className="how-lanes" aria-label="Role based responsibilities">
        {lanes.map((lane) => (
          <article key={lane.title} className="how-lane-card">
            <h3>{lane.title}</h3>
            <ul>
              {lane.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="how-section-head">
        <p className="section-kicker">FAQ</p>
        <h2>Common Questions</h2>
      </section>

      <section className="how-faq" aria-label="How it works frequently asked questions">
        {faqs.map((faq) => (
          <details key={faq.question} className="how-faq-item">
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </section>

      <section className="how-cta">
        <div>
          <p className="section-kicker">Ready</p>
          <h2>Launch your campaign with confidence.</h2>
          <p>Start now and keep every supporter informed from first donation to final impact report.</p>
        </div>
        <div className="how-cta-actions">
          <a href="#" className="how-btn how-btn-primary">
            Create Campaign
          </a>
          <a href="/campaigns" className="how-btn how-btn-secondary">
            View Live Campaigns
          </a>
        </div>
      </section>
    </main>
  );
}

export default HowItWorksPage;
