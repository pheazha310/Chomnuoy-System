import "./css/Navbar.css";
import { Link } from 'react-router-dom';

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

  if (isDonorLoggedIn) {
    const donorName = donorSession.name || 'Donor User';
    const donorImpact = donorSession.impactLevel || 'Gold';

    return (
      <nav className="donor-navbar" aria-label="Donor navigation">
        <Link to="/" className="donor-brand" aria-label="Donor portal home">
          <span className="donor-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.7" />
              <path d="M8 12h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M13 8l3 3-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>DonorPortal</span>
        </Link>

        <label className="donor-search" aria-label="Search organizations">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </svg>
          <input type="search" placeholder="Search organizations..." />
        </label>

        <ul className="donor-links">
          {donorNavItems.map((item) => (
            <li key={item.label}>
              <Link to={item.href} className={isNavItemActive(item.href, pathname) ? 'active' : ''}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <button type="button" className="donor-notify" aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 4a4 4 0 0 0-4 4v2.7c0 .8-.3 1.6-.8 2.2l-1 1.1c-.4.5 0 1.3.7 1.3h10.2c.7 0 1.1-.8.7-1.3l-1-1.1a3.4 3.4 0 0 1-.8-2.2V8a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="1.7" />
            <path d="M10.5 17.2a1.7 1.7 0 0 0 3 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>

        <div className="donor-profile">
          <div>
            <p className="donor-name">{donorName}</p>
            <p className="donor-impact">Impact Level: {donorImpact}</p>
          </div>
          <img
            src={donorSession.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80'}
            alt={donorName}
            className="donor-avatar-photo"
          />
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar" aria-label="Primary">
      <a href="/" className="brand" aria-label="Chomnuoy home">
        <span className="brand-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            className="logo-mark"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.8 14.2L8.2 10.8C8.5 10.5 8.9 10.3 9.3 10.3H12.3C13.2 10.3 13.9 9.6 13.9 8.7C13.9 7.8 13.2 7.1 12.3 7.1H9.7C8.9 7.1 8.2 7.4 7.6 8L5.9 9.7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7.4 12.8L11.1 16.5C11.7 17.1 12.5 17.4 13.3 17.4H15.5C16.7 17.4 17.8 16.4 17.8 15.1C17.8 13.9 16.8 12.9 15.5 12.9H13.7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 9L3.8 10.2C3.3 10.7 3.3 11.5 3.8 12L4.8 13C5.3 13.5 6.1 13.5 6.6 13L7.8 11.8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16.6 5.3C16.1 4.7 15.4 4.4 14.6 4.4C13.2 4.4 12 5.6 12 7C12 8.2 12.9 9.3 14.2 9.6C14.8 9.7 15.7 9.7 16.2 9.5C17.4 9.1 18.2 8.1 18.2 7C18.2 6.4 18 5.8 17.6 5.3"
              stroke="currentColor"
              strokeWidth="1.6"
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

      <ul className="nav-links">
        {guestNavItems.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
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

      <Link to="/login?redirect=%2Fcampaigns" className="nav-cta">
        Donate Now
      </Link>
    </nav>
  );
}

export default Navbar;
