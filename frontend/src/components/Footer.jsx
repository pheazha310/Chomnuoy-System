import './css/Footer.css';
import { useState } from 'react';

const exploreLinks = ['Featured Causes', 'Newest Projects', 'Education', 'Health & Wellness', 'Environment'];
const resourceLinks = ['About Us', 'How it Works', 'Transparency', 'Success Stories', 'Help Center'];
const policyLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy'];
const socialLinks = [
  {
    label: 'Website',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.75 12h16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 3.75c2.35 2.33 3.67 5.18 3.67 8.25S14.35 17.92 12 20.25c-2.35-2.33-3.67-5.18-3.67-8.25S9.65 6.08 12 3.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:hello@chomnuoy.org',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3.75" y="6" width="16.5" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="m6.5 8.5 5.5 4.5 5.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Share',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.75 15.25 15.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M10.75 8.5h4.75v4.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.75 5.75h8.5a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-8.5a2 2 0 0 1-2-2v-8.5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
];

function getDonorSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed) return null;
    if (!parsed.isLoggedIn && (parsed.email || parsed.userId || parsed.role || parsed.accountType)) {
      const normalized = { ...parsed, isLoggedIn: true };
      window.localStorage.setItem('chomnuoy_session', JSON.stringify(normalized));
      return normalized;
    }
    return parsed;
  } catch {
    return null;
  }
}

function Footer() {
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState({ type: '', message: '' });
  const donorSession = getDonorSession();
  const isDonorLoggedIn = donorSession?.isLoggedIn && donorSession?.role === 'Donor';

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function handleNewsletterSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setNewsletterStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    try {
      const raw = window.localStorage.getItem('chomnuoy_newsletter_subscribers');
      const existing = raw ? JSON.parse(raw) : [];
      const subscribers = Array.isArray(existing) ? existing : [];

      if (!subscribers.includes(normalizedEmail)) {
        subscribers.push(normalizedEmail);
      }

      window.localStorage.setItem('chomnuoy_newsletter_subscribers', JSON.stringify(subscribers));
      setNewsletterStatus({ type: 'success', message: 'Subscribed successfully.' });
      setEmail('');
    } catch {
      setNewsletterStatus({ type: 'error', message: 'Unable to subscribe right now.' });
    }
  }

  return (
    <footer className={`site-footer ${isDonorLoggedIn ? 'site-footer-donor' : ''}`} aria-label="Footer">
      <div className="footer-top">
        <section className="footer-col footer-brand">
          <div className="footer-logo" aria-label="Chomnuoy logo">
            <span className="footer-logo-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="footer-logo-mark" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22 8.65a2 2 0 0 0-3.42-1.41L17 8.82l-1.58-1.58A2 2 0 0 0 12 8.65c0 .53.21 1.04.59 1.41l3.35 3.35c.58.58 1.52.58 2.1 0l3.37-3.35A2 2 0 0 0 22 8.65Z"
                  stroke="currentColor"
                  strokeWidth="2.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 14h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3z"
                  stroke="currentColor"
                  strokeWidth="2.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 16h4l5.2 1.88A2 2 0 0 1 17.5 19.8"
                  stroke="currentColor"
                  strokeWidth="2.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 20.4 13.1 22 21 19.7c.82-.24 1.27-1.11 1.03-1.93A1.6 1.6 0 0 0 20.5 16.6H16"
                  stroke="currentColor"
                  strokeWidth="2.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.5 15.8v4.5"
                  stroke="currentColor"
                  strokeWidth="2.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="footer-logo-text">
              <span className="footer-logo-title">{'\u1787\u17c6\u1793\u17bd\u1799 / CHOMNUOY'}</span>
              <span className="footer-logo-subtitle">DIGITAL DONATION PLATFORM</span>
            </span>
          </div>
          <p>
            Chomnuoy is a global crowdfunding platform dedicated to empowering local communities and fostering
            sustainable growth through collective giving.
          </p>
          <div className="footer-socials">
            {socialLinks.map((item) => (
              <a href={item.href} aria-label={item.label} key={item.label}>
                <span aria-hidden="true" className="footer-social-icon">{item.icon}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="footer-col">
          <h3>Explore</h3>
          <ul>
            {exploreLinks.map((item) => (
              <li key={item}>
                <a href="#">{item}</a>
              </li>
            ))}
          </ul>
        </section>

        <section className="footer-col">
          <h3>Resources</h3>
          <ul>
            {resourceLinks.map((item) => (
              <li key={item}>
                <a href="#">{item}</a>
              </li>
            ))}
          </ul>
        </section>

        <section className="footer-col">
          <h3>Newsletter</h3>
          <p className="newsletter-copy">Stay updated with the latest causes and impact reports.</p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <button type="submit" aria-label="Subscribe">
              &gt;
            </button>
          </form>
          {newsletterStatus.message ? (
            <p className={`newsletter-status ${newsletterStatus.type === 'error' ? 'is-error' : 'is-success'}`}>
              {newsletterStatus.message}
            </p>
          ) : null}
        </section>
      </div>

      <div className="footer-bottom">
        <p>{'\u00a9 2026 CHOMNUOY PLATFORM. ALL RIGHTS RESERVED.'}</p>
        <div className="footer-policies">
          {policyLinks.map((item) => (
            <a href="#" key={item}>
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;

