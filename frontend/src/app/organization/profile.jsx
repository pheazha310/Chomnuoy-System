import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import Map from '../home/map.jsx';

function getOrganizationSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredProfile() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_org_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatJoined(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatCompactNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  return number.toLocaleString('en-US');
}

function formatMoney(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '$0';
  return `$${number.toLocaleString('en-US')}`;
}

export default function OrganizationProfilePage() {
  const session = useMemo(() => getOrganizationSession(), []);
  const storedProfile = useMemo(() => getStoredProfile(), []);
  const [orgData, setOrgData] = useState(null);
  const [stats, setStats] = useState({ totalCampaigns: 0, totalDonations: 0, totalDonors: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const organizationName = storedProfile?.name || orgData?.name || session?.name || 'Organization';
  const initials = organizationName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'OR';
  const logoUrl = storedProfile?.logo || orgData?.logo || orgData?.logo_url || '';

  const fallbackSocials = [
    { label: 'Facebook', value: 'facebook.com/chomnuoy' },
    { label: 'Instagram', value: '@chomnuoy' },
    { label: 'Telegram', value: 't.me/chomnuoy' },
  ];
  const storedSocials = storedProfile?.socials;
  const normalizedSocials = Array.isArray(storedSocials)
    ? storedSocials
    : storedSocials
      ? [
          { label: 'Facebook', value: storedSocials.facebook || 'facebook.com/chomnuoy' },
          { label: 'Instagram', value: storedSocials.instagram || '@chomnuoy' },
          { label: 'Telegram', value: storedSocials.telegram || 't.me/chomnuoy' },
        ]
      : fallbackSocials;

  const latitude = storedProfile?.latitude || orgData?.latitude || '';
  const longitude = storedProfile?.longitude || orgData?.longitude || '';
  const hasCoordinates = latitude && longitude;
  useEffect(() => {
    const sessionData = getOrganizationSession();
    const organizationId = Number(sessionData?.userId ?? 0);
    if (!organizationId) {
      setError('Your session is missing an account id. Please sign in again.');
      setLoading(false);
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      fetch(`${apiBase}/organizations/${organizationId}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${apiBase}/campaigns`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiBase}/donations`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([organization, campaignsData, donationsData]) => {
        if (!active) return;
        setOrgData(organization);

        const campaigns = Array.isArray(campaignsData) ? campaignsData : [];
        const donations = Array.isArray(donationsData) ? donationsData : [];
        const filteredCampaigns = campaigns.filter(
          (item) => Number(item.organization_id) === organizationId,
        );
        const filteredDonations = donations.filter(
          (item) => Number(item.organization_id) === organizationId,
        );
        const donorIds = new Set(
          filteredDonations.map((item) => Number(item.user_id)).filter(Boolean),
        );
        const totalDonations = filteredDonations.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0,
        );

        setStats({
          totalCampaigns: filteredCampaigns.length,
          totalDonations,
          totalDonors: donorIds.size,
        });
      })
      .catch(() => {
        if (!active) return;
        setError('Failed to load organization profile.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const profile = {
    name: organizationName,
    joined: storedProfile?.joined || formatJoined(orgData?.created_at),
    about: storedProfile?.about || orgData?.description || 'Organization profile is being updated.',
    contact: {
      email: storedProfile?.email || orgData?.email || session?.email || 'contact@chomnuoy.org',
      phone: storedProfile?.phone || orgData?.phone || 'N/A',
      location: storedProfile?.location || orgData?.location || 'Phnom Penh, Cambodia',
      coordinates: hasCoordinates ? `${latitude}, ${longitude}` : 'Not set yet',
      website: storedProfile?.website || orgData?.website || 'chomnuoy.org',
    },
    stats: [
      { label: 'Total Campaigns', value: storedProfile?.totalCampaigns || formatCompactNumber(stats.totalCampaigns) },
      { label: 'Total Donations', value: storedProfile?.totalDonations || formatMoney(stats.totalDonations) },
      { label: 'Number of Donors', value: storedProfile?.totalDonors || formatCompactNumber(stats.totalDonors) },
    ],
    impactAreas: storedProfile?.impactAreas || ['Amazon Basin', 'Southeast Asian Rainforests', 'Arctic Circle'],
    socials: normalizedSocials,
  };

  return (
    <div className="org-page">
      <OrganizationSidebar />
      <main className="org-main">
        <section className="org-profile-header">
          <div className="org-profile-header-left">
            <div className="org-profile-pill" aria-label="Organization profile">
              <span className="org-profile-pill-avatar" aria-hidden="true">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="org-profile-pill-logo" />
                ) : (
                  initials
                )}
                <span className="org-profile-pill-status" />
              </span>
              <div className="org-profile-pill-meta">
                <p className="org-profile-pill-name">{profile.name}</p>
                <p className="org-profile-pill-role">Organization</p>
              </div>
            </div>
          </div>
          <div className="org-profile-header-actions">
            <Link to="/organization/profile/edit" className="org-profile-edit-btn">
              Edit Profile
            </Link>
          </div>
        </section>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <section className="org-profile-grid">
          <div className="org-profile-left">
            <article className="org-profile-card">
              <div className="org-profile-card-head">
                <h2>About {profile.name}</h2>
                <span className="org-profile-meta">Joined {profile.joined}</span>
              </div>
              <p className="org-profile-body">{loading ? 'Loading profile details...' : profile.about}</p>
            </article>

            <div className="org-profile-stats">
              {profile.stats.map((stat) => (
                <article key={stat.label} className="org-profile-stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>

            <article className="org-profile-card org-profile-map">
              <div className="org-profile-card-head">
                <h2>Headquarters</h2>
                <span className="org-profile-meta">{hasCoordinates ? profile.contact.coordinates : profile.contact.location}</span>
              </div>
              <div className="org-profile-map-shell">
                <Map />
              </div>
              <p className="org-profile-location-caption">
                {hasCoordinates ? `Saved coordinates: ${latitude} | ${longitude}` : 'Use the map below to detect location from your device.'}
              </p>
              <div className="org-profile-tags">
                {profile.impactAreas.map((area) => (
                  <span key={area} className="org-profile-tag">{area}</span>
                ))}
              </div>
            </article>
          </div>

          <aside className="org-profile-right">
            <article className="org-profile-card">
              <h2>Contact Details</h2>
              <div className="org-profile-contact-list">
                <div>
                  <small>Email</small>
                  <p>{profile.contact.email}</p>
                </div>
                <div>
                  <small>Phone</small>
                  <p>{profile.contact.phone}</p>
                </div>
                <div>
                  <small>Location</small>
                  <p>{profile.contact.location}</p>
                </div>
                <div>
                  <small>Coordinates</small>
                  <p>{profile.contact.coordinates}</p>
                </div>
                <div>
                  <small>Website</small>
                  <p>{profile.contact.website}</p>
                </div>
              </div>
            </article>

            <article className="org-profile-card">
              <h2>Connect With Us</h2>
              <div className="org-profile-socials">
                {profile.socials.map((social) => (
                  <span key={social.label} className="org-profile-social">
                    {social.label}: {social.value}
                  </span>
                ))}
              </div>
            </article>

            <button type="button" className="org-profile-share">
              Share Profile
            </button>
          </aside>
        </section>
      </main>
    </div>
  );
}
