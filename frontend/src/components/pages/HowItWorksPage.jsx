import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  ChartNoAxesColumn,
  CircleCheck,
  Eye,
  MessageSquare,
  QrCode,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import heroImage from '../../images/kids-1.png';
import '../css/HowItWorks.css';

const donationMoneySteps = [
  {
    icon: Search,
    title: '1. Find a Cause',
    description:
      'Browse our curated list of verified local projects, non-profits, and families in need within your community.',
  },
  {
    icon: QrCode,
    title: '2. Scan to Pay',
    description: 'Use your banking app to securely transfer funds instantly. No hidden fees, just direct impact.',
  },
  {
    icon: ChartNoAxesColumn,
    title: '3. Track Impact',
    description: 'Receive real-time updates and visual reports showing exactly how your contribution is changing lives.',
  },
];

const materialSteps = [
  {
    icon: Box,
    title: '1. List Items',
    description: "Take photos and describe the condition of the materials you'd like to donate.",
  },
  {
    icon: Truck,
    title: '2. Schedule Pickup',
    description: 'Choose a convenient time for our logistics partners to collect the items from your doorstep.',
  },
  {
    icon: CircleCheck,
    title: '3. Delivery Confirmation',
    description: 'Get a notification and photo once your donation reaches the intended recipient.',
  },
];

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Rigorous Verification',
    description: 'Every beneficiary and organization undergoes a multi-step background check before joining.',
  },
  {
    icon: Eye,
    title: 'Full Transparency',
    description: 'Public ledgers and real-time reporting allow you to follow every cent of your donation.',
  },
  {
    icon: MessageSquare,
    title: 'Direct Impact',
    description: 'We minimize administrative overhead to ensure maximum resources go directly to the cause.',
  },
];

function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState('money');
  const workflowAnimationKey = `workflow-${activeTab}`;

  return (
    <main className="how-page">
      <section className="how-hero">
        <div className="how-hero-content">
          <h1>How Chomnuoy Works</h1>
          <p>
            Empowering communities through transparent giving. Whether it's direct financial aid or essential supplies,
            your contribution makes a real difference in people's lives.
          </p>
          <div className="how-hero-actions">
            <Link to="/campaigns" className="how-button how-button-primary">
              Get Started
            </Link>
            <Link to="/campaigns" className="how-button how-button-secondary">
              Watch Video
            </Link>
          </div>
        </div>
        <div className="how-hero-media">
          <img src={heroImage} alt="Children supported by a community campaign" />
        </div>
      </section>

      <section className="how-workflow">
        <div className="how-tabs" role="tablist" aria-label="Donation type tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'money'}
            className={`how-tab ${activeTab === 'money' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('money')}
          >
            Donating Money
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'materials'}
            className={`how-tab ${activeTab === 'materials' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            Donating Materials
          </button>
        </div>

        {activeTab === 'money' ? (
          <section key={workflowAnimationKey} className="how-cards-grid" aria-label="Money donation steps">
            {donationMoneySteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="how-step-card" style={{ '--item-index': index }}>
                  <span className="how-step-icon">
                    <Icon size={18} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              );
            })}
          </section>
        ) : (
          <section key={workflowAnimationKey} className="how-material-section" aria-label="Material donation steps">
            <h2>Donating Materials</h2>
            <p className="how-section-subtitle">
              Have extra supplies? Furniture, books, or electronics can find a new home where they are needed most.
            </p>
            <div className="how-material-flow">
              {materialSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="how-material-item" style={{ '--item-index': index }}>
                    <span className="how-material-icon">
                      <Icon size={22} />
                    </span>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </section>

      <section className="how-trust-section">
        <h2>Why Trust Chomnuoy?</h2>
        <p className="how-section-subtitle">
          We prioritize security and clarity in every transaction to ensure your kindness reaches its destination.
        </p>
        <div className="how-trust-grid">
          {trustPoints.map((item, index) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="how-trust-card" style={{ '--item-index': index }}>
                <span className="how-trust-icon">
                  <Icon size={14} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="how-cta">
        <h2>Ready to make your first donation?</h2>
        <p>Join thousands of donors who are already making an impact. Your journey to change lives starts with a single step.</p>
        <Link to="/campaigns" className="how-button how-button-primary">
          Start Now
        </Link>
      </section>
    </main>
  );
}

export default HowItWorksPage;
