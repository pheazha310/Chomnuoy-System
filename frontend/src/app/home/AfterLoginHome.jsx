import { Link } from 'react-router-dom';
import {
  Bell,
  CircleUserRound,
  LogOut,
  Search,
  Users,
  FileText,
  Building2,
  Truck,
  Award,
  Star,
  Smile,
  Leaf
} from 'lucide-react';
import schoolSuppliesImage from '@/images/organization1.png';
import cleanWaterImage from '@/images/kids.jpg';
import './afterLoginHome.css';

const campaigns = [
  {
    id: '1',
    image: schoolSuppliesImage,
    badge: 'ENDING SOON',
    badgeTone: 'ending',
    title: 'School Supplies for Remote Villages',
    description:
      'Help 200 students in Ratanakiri get the essential books and stationery they need for the new term.',
    raised: '$1,840 raised',
    progressLabel: '92%',
    progress: 92,
  },
  {
    id: '2',
    image: cleanWaterImage,
    badge: 'URGENT',
    badgeTone: 'urgent',
    title: 'Clean Water Project: Takeo Province',
    description:
      'Building 5 new community wells to provide safe drinking water for over 150 families.',
    raised: '$2,250 raised',
    progressLabel: '45%',
    progress: 45,
  },
];

const activity = [
  {
    id: 'a1',
    icon: Building2,
    text: 'Smile Cambodia posted a new update:',
    note:
      '"Thanks to donors like Rithy, we successfully completed 12 surgeries this week!"',
    time: '2 hours ago',
  },
  {
    id: 'a2',
    icon: Truck,
    text:
      'Your material pickup request for Old Clothing has been scheduled.',
    note: 'Scheduled for Tomorrow, 10:00 AM',
    time: '5 hours ago',
  },
  {
    id: 'a3',
    icon: Star,
    text: 'You earned the "Community Champion" badge!',
    note: 'Awarded for supporting 5 different NGOs.',
    time: 'Yesterday',
  },
];

function AfterLoginHome() {
  return (
    <div className="dashboard-home">
      <main className="dashboard-content">
        <section className="welcome-grid">
          <div className="welcome-copy">
            <h1>Welcome back, Rithy!</h1>
            <p>
              You've helped 5 local communities this month through your
              contributions.
            </p>
          </div>

          <article className="metric-card">
            <span>TOTAL DONATED</span>
            <strong>$250.00</strong>
          </article>

          <article className="metric-card is-blue">
            <span>CURRENT IMPACT</span>
            <strong>
              <Users size={16} /> Level 4 Donor
            </strong>
          </article>
        </section>

        <section className="goal-card">
          <div className="goal-head">
            <h2>
              <Award size={17} /> Monthly Donation Goal
            </h2>
            <p>75% Achieved</p>
          </div>

          <div
            className="goal-track"
            role="img"
            aria-label="75 percent achieved"
          >
            <span style={{ width: '75%' }} />
          </div>

          <div className="goal-meta">
            <span>$187.50 raised</span>
            <span>$250.00 goal</span>
          </div>
        </section>

        <section className="dashboard-main-grid">
          <div className="dashboard-main-left">
            <div className="section-head">
              <h2>Urgent Campaigns</h2>
              <Link to="/campaigns">View all</Link>
            </div>

            <div className="campaign-grid">
              {campaigns.map((item) => (
                <article className="campaign-card" key={item.id}>
                  <div
                    className="campaign-image"
                    style={{
                      backgroundImage: `url(${item.image})`,
                    }}
                  >
                    <span
                      className={`campaign-badge ${item.badgeTone}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <div className="campaign-body">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>

                    <div
                      className="campaign-progress"
                      role="img"
                      aria-label={`${item.progressLabel} funded`}
                    >
                      <span
                        style={{
                          width: `${item.progress}%`,
                        }}
                      />
                    </div>

                    <div className="campaign-meta">
                      <strong>{item.raised}</strong>
                      <span>{item.progressLabel}</span>
                    </div>

                    <button type="button">Donate Now</button>
                  </div>
                </article>
              ))}
            </div>

            <section className="personalized">
              <h2>Personalized For You</h2>

              <div className="personalized-grid">
                <article>
                  <span className="topic-icon blue">
                    <Smile size={18} />
                  </span>
                  <div>
                    <strong>Child Education</strong>
                    <p>3 new campaigns match your history</p>
                  </div>
                </article>

                <article>
                  <span className="topic-icon green">
                    <Leaf size={18} />
                  </span>
                  <div>
                    <strong>Environmental Care</strong>
                    <p>Based on your recent follow: SaveMekong</p>
                  </div>
                </article>
              </div>
            </section>
          </div>

          <aside className="dashboard-sidebar">
            <section className="activity-card">
              <h2>
                <FileText size={18} /> Recent Activity
              </h2>

              <ul>
                {activity.map((item) => (
                  <li key={item.id}>
                    <span className="activity-icon">
                      <item.icon size={16} />
                    </span>
                    <div>
                      <p>{item.text}</p>
                      <strong>{item.note}</strong>
                      <span>{item.time}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="outline-btn"
              >
                See All Activity
              </button>
            </section>

            <section className="cta-card">
              <h3>Want to do more?</h3>
              <p>
                Start your own fundraising campaign for a cause
                you care about.
              </p>
              <button type="button">
                Start Campaign
              </button>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default AfterLoginHome;