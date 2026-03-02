import "./css/Navbar.css";
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const guestNavItems = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Organizations", href: "/organizations" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Contact", href: "/contact" },
];

const donorNavItems = [
  { label: 'Home', href: '/' },
  { label: 'Browse Organizations', href: '/organizations' },
  { label: 'Campaigns', href: '/campaigns' },
  { label: 'My Donations', href: '/campaigns' },
  { label: 'Material Pickup', href: '/how-it-works' },
];

function getDonorSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearDonorSession() {
  window.localStorage.removeItem('chomnuoy_session');
}

function isNavItemActive(itemHref, pathname) {
  if (itemHref === '/campaigns') {
    return pathname === '/campaigns' || pathname.startsWith('/campaigns/');
  }

  return pathname === itemHref;
}

function Navbar() {
  const pathname = window.location.pathname;
  const donorSession = getDonorSession();
  const isDonorLoggedIn = donorSession?.isLoggedIn && donorSession?.role === 'Donor';
  const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);

  const handleLogout = () => {
    clearDonorSession();
    window.location.href = '/login';
  };

  useEffect(() => {
    setIsGuestMenuOpen(false);
  }, [pathname]);

  if (isDonorLoggedIn) {
    const donorName = donorSession.name || 'Donor User';
    const donorImpact = donorSession.impactLevel || 'Gold';

    return (
      <nav className="donor-navbar" aria-label="Donor navigation">
        <Link to="/" className="donor-brand" aria-label="Donor portal home">
          <span className="donor-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="4" fill="#60A5FA" />
              <path d="M8 12h5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13 8l3 3-3 3" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 13C7 13 9 15 12 15C15 15 17 13 17 13" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 8a2 2 0 0 0-4 0 2 2 0 0 0 4 0" fill="#ffffff" />
            </svg>
          </span>
          <div className="donor-brand-text">
            <span className="donor-brand-name">ជំនួយ / CHOMNUOY</span>
            <span className="donor-brand-subtitle">DIGITAL DONATION PLATFORM</span>
          </div>
        </Link>

        <ul className="donor-links">
          {donorNavItems.map((item) => (
            <li key={item.label}>
              <Link to={item.href} className={isNavItemActive(item.href, pathname) ? 'active' : ''}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <label className="donor-search" aria-label="Search causes">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input type="search" placeholder="Search causes..." />
        </label>

        <div className="donor-actions">
          <button type="button" className="donor-notify" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="notification-dot"></span>
          </button>

          <button type="button" className="donor-history" aria-label="History">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button type="button" className="donor-logout" aria-label="Logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="m16 17 5-5-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="donor-profile">
            <img
              src={donorSession.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80'}
              alt={donorName}
              className="donor-avatar-photo"
            />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`navbar ${isGuestMenuOpen ? 'menu-open' : ''}`} aria-label="Primary">
      <a href="/" className="brand" aria-label="Chomnuoy home">
        <span className="brand-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            className="logo-mark"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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
        <span className="brand-text">
          <span className="brand-name">
            {"\u1787\u17c6\u1793\u17bd\u1799 / CHOMNUOY"}
          </span>
          <span className="brand-subtitle">DIGITAL DONATION PLATFORM</span>
        </span>
      </a>

      <button
        type="button"
        className="nav-toggle"
        aria-label={isGuestMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isGuestMenuOpen}
        aria-controls="guest-primary-links"
        onClick={() => setIsGuestMenuOpen((previous) => !previous)}
      >
        <span className="nav-toggle-line" />
        <span className="nav-toggle-line" />
        <span className="nav-toggle-line" />
      </button>

      <ul id="guest-primary-links" className={`nav-links ${isGuestMenuOpen ? 'is-open' : ''}`}>
        {guestNavItems.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              onClick={() => setIsGuestMenuOpen(false)}
              className={
                item.href === "/campaigns"
                  ? pathname === "/" || pathname.startsWith("/campaigns")
                    ? "active"
                    : ""
                  : item.href === "/organizations"
                    ? pathname === "/organizations"
                      ? "active"
                      : ""
                  : item.href === "/how-it-works"
                    ? pathname === "/how-it-works"
                      ? "active"
                      : ""
                    : item.href === "/about"
                      ? pathname === "/about"
                        ? "active"
                        : ""
                    : item.href === "/contact"
                      ? pathname === "/contact"
                        ? "active"
                        : ""
                      : pathname === item.href
                        ? "active"
                        : ""
              }
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <Link to="/login?redirect=%2Fcampaigns" className="nav-cta" onClick={() => setIsGuestMenuOpen(false)}>
        Donate Now
      </Link>
    </nav>
  );
}

export default Navbar;

