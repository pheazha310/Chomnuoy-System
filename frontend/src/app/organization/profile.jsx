import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import { useGlobalTheme } from '@/hooks/useOrganizationSettings';

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

function normalizeTextList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function sanitizeWebsite(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function sanitizeSocialLink(label, value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    return { label, value: raw.replace(/^https?:\/\//i, ''), href: raw };
  }

  if (label === 'Instagram') {
    const handle = raw.startsWith('@') ? raw : `@${raw.replace(/^@/, '')}`;
    return {
      label,
      value: handle,
      href: `https://instagram.com/${handle.replace(/^@/, '')}`,
    };
  }

  if (label === 'Telegram') {
    const normalized = raw.replace(/^@/, '').replace(/^t\.me\//i, '');
    return {
      label,
      value: raw.startsWith('http') ? raw : `t.me/${normalized}`,
      href: raw.startsWith('http') ? raw : `https://t.me/${normalized}`,
    };
  }

  return {
    label,
    value: raw,
    href: /^https?:\/\//i.test(raw) ? raw : `https://${raw}`,
  };
}

export default function OrganizationProfilePage() {
  const { displayPrefs } = useGlobalTheme();
  const session = useMemo(() => getOrganizationSession(), []);
  const storedProfile = useMemo(() => getStoredProfile(), []);
  const [orgData, setOrgData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({ totalCampaigns: 0, totalDonations: 0, totalDonors: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  const organizationName = storedProfile?.name || orgData?.name || session?.name || 'Organization';
  const initials = organizationName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'OR';
  const logoUrl = storedProfile?.logo || orgData?.logo || orgData?.logo_url || '';

  const storedSocials = storedProfile?.socials;
  const normalizedSocials = (Array.isArray(storedSocials)
    ? storedSocials
    : storedSocials
      ? [
          sanitizeSocialLink('Facebook', storedSocials.facebook),
          sanitizeSocialLink('Instagram', storedSocials.instagram),
          sanitizeSocialLink('Telegram', storedSocials.telegram),
        ]
      : []
  ).filter(Boolean);

  const [latitude, setLatitude] = useState(storedProfile?.latitude || '');
  const [longitude, setLongitude] = useState(storedProfile?.longitude || '');
  const hasCoordinates = Boolean(latitude && longitude);

  const updateStoredProfile = (coords) => {
    try {
      const existing = getStoredProfile() || {};
      const updated = { ...existing, ...coords };
      window.localStorage.setItem('chomnuoy_org_profile', JSON.stringify(updated));
    } catch {
      // ignore localStorage errors
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        updateStoredProfile({ latitude: lat, longitude: lng });
        setError('');
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const mapValue = storedProfile?.mapQuery || storedProfile?.location || orgData?.location || 'Phnom Penh, Cambodia';
  const mapQuery = encodeURIComponent(mapValue);
  const websiteHref = sanitizeWebsite(storedProfile?.website || orgData?.website || '');

  const themeClass = displayPrefs.highContrast
    ? 'theme-contrast'
    : displayPrefs.darkMode
      ? 'theme-dark'
      : '';

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
        if (!storedProfile?.latitude && organization?.latitude) {
          setLatitude(organization.latitude);
          updateStoredProfile({ latitude: organization.latitude });
        }
        if (!storedProfile?.longitude && organization?.longitude) {
          setLongitude(organization.longitude);
          updateStoredProfile({ longitude: organization.longitude });
        }

        const campaigns = Array.isArray(campaignsData) ? campaignsData : [];
        const donations = Array.isArray(donationsData) ? donationsData : [];
        const filteredCampaigns = campaigns.filter(
          (item) => Number(item.organization_id) === organizationId,
        );
        setCampaigns(filteredCampaigns);
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

  useEffect(() => {
    if (!shareMessage) return undefined;
    const timer = window.setTimeout(() => setShareMessage(''), 2500);
    return () => window.clearTimeout(timer);
  }, [shareMessage]);

  const derivedImpactAreas = useMemo(() => {
    const storedAreas = normalizeTextList(storedProfile?.impactAreas);
    if (storedAreas.length > 0) return storedAreas;

    const campaignAreas = campaigns
      .map((item) => item.category || item.campaign_type || item.location)
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    return Array.from(new Set(campaignAreas)).slice(0, 4);
  }, [campaigns, storedProfile?.impactAreas]);

  const handleShareProfile = async () => {
    const shareUrl = window.location.href;
    const shareText = `${organizationName} on Chomnuoy`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${organizationName} Profile`,
          text: shareText,
          url: shareUrl,
        });
        setShareMessage('Profile shared.');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage('Profile link copied.');
        return;
      }
    } catch {
      setShareMessage('Unable to share profile.');
      return;
    }

    setShareMessage('Sharing is not available on this device.');
  };

  const profile = {
    name: organizationName,
    joined: storedProfile?.joined || formatJoined(orgData?.created_at),
    about: storedProfile?.about || orgData?.description || 'Organization profile is being updated.',
    contact: {
      email: storedProfile?.email || orgData?.email || session?.email || 'contact@chomnuoy.org',
      phone: storedProfile?.phone || orgData?.phone || 'N/A',
      location: storedProfile?.location || orgData?.location || 'Phnom Penh, Cambodia',
      coordinates: hasCoordinates ? `${latitude}, ${longitude}` : 'Not set yet',
      website: storedProfile?.website || orgData?.website || 'N/A',
    },
    stats: [
      { label: 'Total Campaigns', value: formatCompactNumber(stats.totalCampaigns) },
      { label: 'Total Donations', value: formatMoney(stats.totalDonations) },
      { label: 'Number of Donors', value: formatCompactNumber(stats.totalDonors) },
    ],
    impactAreas: derivedImpactAreas,
    socials: normalizedSocials,
  };

  return (
    <div className={`org-page org-profile-page ${themeClass}`}>
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
          <div className="org-profile-error">
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
                <span className="org-profile-meta">{hasCoordinates ? `${latitude}, ${longitude}` : profile.contact.location}</span>
              </div>
              <p className="org-profile-location-caption">
                {hasCoordinates ? `Saved coordinates: ${latitude} | ${longitude}` : 'No location set yet. Click below to detect current coordinates.'}
              </p>
              <button
                type="button"
                className="org-profile-btn"
                onClick={detectLocation}
                style={{ marginBottom: '0.6rem' }}
              >
                Detect My Location (Lat/Lng)
              </button>
              <div className="org-profile-map-actions">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="org-profile-map-link"
                >
                  Open in Maps
                </a>
              </div>
              <iframe
                title="Organization Map"
                className="org-profile-map-embed"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {profile.impactAreas.length > 0 ? (
                <div className="org-profile-tags">
                  {profile.impactAreas.map((area) => (
                    <span key={area} className="org-profile-tag">{area}</span>
                  ))}
                </div>
              ) : null}
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
                  <small>Coordinates</small>
                  <p>{profile.contact.coordinates}</p>
                </div>
                <div>
                  <small>Website</small>
                  <p>
                    {websiteHref ? (
                      <a href={websiteHref} target="_blank" rel="noreferrer" className="org-profile-inline-link">
                        {profile.contact.website}
                      </a>
                    ) : (
                      profile.contact.website
                    )}
                  </p>
                </div>
              </div>
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}
