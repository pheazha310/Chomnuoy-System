import "./css/Navbar.css";
import { Link, useNavigate } from 'react-router-dom';
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
<<<<<<< HEAD
  { label: 'Home', href: '/' },
  { label: 'Organizations', href: '/organizations' },
=======
  { label: 'Home', href: '#' },
  { label: 'Organizations', href: '#' },
>>>>>>> 6302858a648a56ab43552b93bf4b414deefa1fed
  { label: 'Campaigns', href: '/campaigns/donor' },
  { label: 'My Donations', href: '/donations' },
  { label: 'Material Pickup', href: '/pickup' },
  { label: "Contact", href: "/contact" },
<<<<<<< HEAD
];

const initialNotifications = [
  {
    id: 'donation-confirmed',
    title: 'Donation Confirmed',
    message: 'Your $50 donation to the Education Fund was successful. Thank you for your support!',
    time: '2m ago',
    type: 'success',
    isRead: false,
  },
  {
    id: 'delivery-update',
    title: 'Delivery Update',
    message: 'The medical supplies you funded for the local clinic are currently out for delivery.',
    time: '1h ago',
    type: 'info',
    isRead: false,
  },
  {
    id: 'message-thankyou',
    title: 'Message from SaveTheChildren',
    message: 'Your contribution is making a real difference in the lives of 20 students this semester.',
    time: '3h ago',
    type: 'message',
    isRead: false,
  },
  {
    id: 'campaign-milestone',
    title: 'Campaign Milestone Reached',
    message: 'Clean Water Initiative reached 80% of its goal. Share it to help complete funding.',
    time: '6h ago',
    type: 'info',
    isRead: true,
  },
  {
    id: 'tax-receipt',
    title: 'Tax Receipt Available',
    message: 'Your monthly donation summary and tax receipt for this period is now ready to download.',
    time: '1d ago',
    type: 'success',
    isRead: true,
  },
=======
>>>>>>> 6302858a648a56ab43552b93bf4b414deefa1fed
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
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const donorSession = getDonorSession();
  const isDonorLoggedIn = donorSession?.isLoggedIn && donorSession?.role === 'Donor';
  const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
<<<<<<< HEAD
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAllNotificationsOpen, setIsAllNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const displayedNotifications = isAllNotificationsOpen ? notifications : notifications.slice(0, 3);
=======
>>>>>>> 6302858a648a56ab43552b93bf4b414deefa1fed

  const handleLogout = () => {
    clearDonorSession();
    window.location.href = '/login';
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    const normalized = query.toLowerCase();
    const encodedQuery = encodeURIComponent(query);

    if (normalized.includes('organization') || normalized.includes('ngo')) {
      navigate(`/organizations?search=${encodedQuery}`);
      return;
    }
    if (normalized.includes('donation')) {
      navigate(`/donations?search=${encodedQuery}`);
      return;
    }
    if (normalized.includes('pickup') || normalized.includes('material')) {
      navigate(`/pickup?search=${encodedQuery}`);
      return;
    }
    if (normalized.includes('contact') || normalized.includes('support')) {
      navigate(`/contact?search=${encodedQuery}`);
      return;
    }

    navigate(`/campaigns?search=${encodedQuery}`);
  };

  useEffect(() => {
    setIsGuestMenuOpen(false);
    setIsProfileMenuOpen(false);
<<<<<<< HEAD
    setIsNotificationOpen(false);
    setIsAllNotificationsOpen(false);
=======
>>>>>>> 6302858a648a56ab43552b93bf4b414deefa1fed
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (isProfileMenuOpen && !event.target.closest('.donor-profile')) {
        setIsProfileMenuOpen(false);
      }
<<<<<<< HEAD
      if (isNotificationOpen && !event.target.closest('.donor-notification')) {
        setIsNotificationOpen(false);
      }
=======
>>>>>>> 6302858a648a56ab43552b93bf4b414deefa1fed
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
<<<<<<< HEAD
  }, [isProfileMenuOpen, isNotificationOpen]);
=======
  }, [isProfileMenuOpen]);
>>>>>>> 6302858a648a56ab43552b93bf4b414deefa1fed

  if (isDonorLoggedIn) {
    const donorName = donorSession.name || 'Donor User';
    const donorImpact = donorSession.impactLevel || 'Gold';

    return (
      <nav className="donor-navbar" aria-label="Donor navigation">
        <Link to="/" className="donor-brand" aria-label="Donor portal home">
          <span className="donor-brand-mark" aria-hidden="true">
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
          <div className="donor-brand-text">
            <span className="donor-brand-name">{"\u1787\u17c6\u1793\u17bd\u1799 / CHOMNUOY"}</span>
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

        <form className="donor-search" aria-label="Search causes" onSubmit={handleSearchSubmit}>
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="search"
            placeholder="Search causes..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>

        <div className="donor-actions">
          <div className="donor-notification">
            <button
              type="button"
              className={`donor-notify ${isNotificationOpen ? 'is-active' : ''}`}
              aria-label="Notifications"
              aria-expanded={isNotificationOpen}
              aria-pressed={isNotificationOpen}
              onClick={() => setIsNotificationOpen((previous) => !previous)}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {unreadCount > 0 && <span className="notification-dot"></span>}
            </button>

<<<<<<< HEAD
            {isNotificationOpen && (
              <div className="donor-notification-dropdown" aria-label="Notifications panel">
                <div className="donor-notification-header">
                  <h4>Notifications</h4>
                  <button
                    type="button"
                    className="donor-mark-read"
                    onClick={() => setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })))}
                    disabled={unreadCount === 0}
                  >
                    Mark all as read
                  </button>
                </div>

                <ul className="donor-notification-list">
                  {displayedNotifications.map((item) => (
                    <li key={item.id} className={`donor-notification-item ${item.isRead ? 'is-read' : ''}`}>
                      <span className={`donor-notification-icon ${item.type}`} aria-hidden="true">
                        {item.type === 'success' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="9" strokeWidth="2" />
                            <path d="m8 12 2.2 2.2L16 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {item.type === 'info' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 7h13l4 4v6H7l-4-4z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="8.5" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
                            <circle cx="16.5" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
                          </svg>
                        )}
                        {item.type === 'message' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="m12 20-1.2-1.1C6.2 14.7 3 11.8 3 8.2 3 5.3 5.2 3 8.1 3c1.7 0 3.2.8 4 2.1C12.9 3.8 14.5 3 16.1 3 19 3 21 5.3 21 8.2c0 3.6-3.2 6.5-7.8 10.7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <div className="donor-notification-content">
                        <div className="donor-notification-topline">
                          <p>{item.title}</p>
                          <time>{item.time}</time>
                        </div>
                        <span>{item.message}</span>
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="donor-view-all-notifications"
                  onClick={() => {
                    setIsAllNotificationsOpen((previous) => !previous);
                  }}
                >
                  {isAllNotificationsOpen ? 'View less notifications' : 'View all notifications'}
                </button>
              </div>
            )}
          </div>

=======
>>>>>>> 6302858a648a56ab43552b93bf4b414deefa1fed
          {/* <button type="button" className="donor-history" aria-label="History">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button> */}

          {/* <button type="button" className="donor-logout" aria-label="Logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="m16 17 5-5-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button> */}

          {/* <Link to="/campaigns" className="nav-cta">Donate Now</Link> */}

          <div className="donor-profile">
            <button 
              type="button" 
              className="donor-profile-button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              aria-label="Profile menu"
              aria-expanded={isProfileMenuOpen}
            >
              <img
                src={donorSession.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80'}
                alt={donorName}
                className="donor-avatar-photo"
              />
            </button>
            
            {isProfileMenuOpen && (
              <div className="donor-profile-dropdown" aria-label="Profile menu" style={{display: 'block'}}>
                <div className="donor-profile-header">
                  <img
                    src={donorSession.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80'}
                    alt={donorName}
                    className="donor-profile-avatar"
                  />
                  <div className="donor-profile-info">
                    <p className="donor-profile-name">{donorName}</p>
                    <p className="donor-profile-email">{donorSession.email || 'donor@example.com'}</p>
                    <p className="donor-profile-impact">Impact Level: {donorImpact}</p>
                  </div>
                </div>
                
                <div className="donor-profile-divider"></div>
                
                <div className="donor-profile-menu">
                  <Link to="/profile" className="donor-profile-menu-item" onClick={() => setIsProfileMenuOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                    </svg>
                    My Profile
                  </Link>
                  
                  <Link to="/settings" className="donor-profile-menu-item" onClick={() => setIsProfileMenuOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor">
                      <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                      <path d="M12 1v6m0 6v6m4.22-13.22 4.22 4.22M1.54 9.54l4.22 4.22M20.46 14.46l-4.22 4.22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Settings
                  </Link>
                  
                  <Link to="/donations" className="donor-profile-menu-item" onClick={() => setIsProfileMenuOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                      <path d="M3 9h18M9 21V9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    My Donations
                  </Link>
                  
                  <button 
                    type="button" 
                    className="donor-profile-menu-item donor-profile-logout"
                    onClick={() => {
                      handleLogout();
                      setIsProfileMenuOpen(false);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="m16 17 5-5-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
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

