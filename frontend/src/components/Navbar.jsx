import "./css/Navbar.css";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  { label: 'Organizations', href: '/organizations' },
  { label: 'Campaigns', href: '/campaigns/donor' },
  { label: 'My Donations', href: '/donations' },
  { label: 'Material Pickup', href: '/pickup' },
  { label: "Contact", href: "/contact" },
];

function getDonorSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearAuthState() {
  window.localStorage.removeItem('chomnuoy_session');
  window.localStorage.removeItem('authToken');
}

function isNavItemActive(itemHref, pathname) {
  if (itemHref === '/campaigns') {
    return pathname === '/campaigns' || pathname.startsWith('/campaigns/');
  }

  if (itemHref === '/campaigns/donor') {
    return pathname === '/campaigns' || pathname.startsWith('/campaigns/');
  }

  return pathname === itemHref;
}

function isGuestNavItemActive(itemHref, pathname) {
  if (itemHref === '/campaigns') {
    return pathname === '/campaigns' || pathname.startsWith('/campaigns/');
  }

  return pathname === itemHref;
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const donorSession = getDonorSession();
  const isDonorLoggedIn = donorSession?.isLoggedIn && donorSession?.role === 'Donor';
  const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutPopupOpen, setIsLogoutPopupOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', title: 'Donation Received', message: 'Thank you for supporting Rural Health Alliance.', time: '2m ago', isRead: false },
    { id: 2, type: 'info', title: 'Campaign Update', message: 'Ocean Reclaim Project shared a new progress update.', time: '1h ago', isRead: false },
    { id: 3, type: 'message', title: 'Pickup Reminder', message: 'Your material pickup is scheduled for tomorrow.', time: 'Yesterday', isRead: true },
  ]);
  const notificationRef = useRef(null);

  const handleLogout = () => {
    const savedBeforeLoginPath = donorSession?.logoutRedirectTo;
    const logoutTarget =
      savedBeforeLoginPath &&
      savedBeforeLoginPath.startsWith('/') &&
      !savedBeforeLoginPath.startsWith('/logout')
        ? savedBeforeLoginPath
        : '/';

    clearAuthState();
    window.location.href = logoutTarget;
  };

  useEffect(() => {
    setIsGuestMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsLogoutPopupOpen(false);
    setIsNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (isProfileMenuOpen && !event.target.closest('.donor-profile')) {
        setIsProfileMenuOpen(false);
      }
      if (isNotificationsOpen && notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen, isProfileMenuOpen]);

  useEffect(() => {
    if (!isLogoutPopupOpen) return undefined;

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsLogoutPopupOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isLogoutPopupOpen]);

  useEffect(() => {
    const urlQuery = new URLSearchParams(location.search).get('search')?.trim() || '';
    setSearchQuery(urlQuery);
  }, [location.search]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim().replace(/\s+/g, ' ');
    if (!query) return;

    const encoded = encodeURIComponent(query);
    
    // Always navigate to campaigns page for search
    navigate(`/campaigns?search=${encoded}`);
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const markAllNotificationsRead = () => {
    setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
  };

  const logoutPopupMarkup = (
    <div
      className="logout-popup-overlay"
      role="presentation"
      onClick={() => setIsLogoutPopupOpen(false)}
    >
      <div
        className="logout-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-popup-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="logout-popup-header">
          <h3 id="logout-popup-title">Log out from your account?</h3>
          <button
            type="button"
            className="logout-popup-close"
            aria-label="Close logout popup"
            onClick={() => setIsLogoutPopupOpen(false)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor">
              <path d="m18 6-12 12" strokeWidth="2" strokeLinecap="round" />
              <path d="m6 6 12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p>You will need to sign in again to access donor features.</p>
        <div className="logout-popup-actions">
          <button
            type="button"
            className="logout-popup-cancel"
            onClick={() => setIsLogoutPopupOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="logout-popup-confirm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

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
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearchSubmit(event);
              }
            }}
          />
        </form>

        <div className="donor-actions">
          <div className="donor-notification" ref={notificationRef}>
            <button
              type="button"
              className={`donor-notify ${isNotificationsOpen ? 'is-active' : ''}`}
              aria-label="Notifications"
              aria-expanded={isNotificationsOpen}
              onClick={() => setIsNotificationsOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {unreadCount > 0 ? <span className="notification-dot"></span> : null}
            </button>
            {isNotificationsOpen ? (
              <div className="donor-notification-dropdown" aria-label="Notification list">
                <div className="donor-notification-header">
                  <h4>Notifications</h4>
                  <button type="button" className="donor-mark-read" onClick={markAllNotificationsRead} disabled={unreadCount === 0}>
                    Mark all read
                  </button>
                </div>
                <ul className="donor-notification-list">
                  {notifications.map((item) => (
                    <li key={item.id} className={`donor-notification-item ${item.isRead ? 'is-read' : ''}`}>
                      <div className={`donor-notification-icon ${item.type}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                          <circle cx="12" cy="12" r="8" strokeWidth="2" />
                          <path d="M12 8v4l2 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
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
              </div>
            ) : null}
          </div>

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
                      setIsProfileMenuOpen(false);
                      setIsLogoutPopupOpen(true);
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

        {isLogoutPopupOpen && typeof document !== 'undefined'
          ? createPortal(logoutPopupMarkup, document.body)
          : null}
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
              className={isGuestNavItemActive(item.href, pathname) ? 'active' : ''}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <Link to="/login?redirect=%2F" className="nav-cta" onClick={() => setIsGuestMenuOpen(false)}>
        Donate Now
      </Link>
    </nav>
  );
}

export default Navbar;

