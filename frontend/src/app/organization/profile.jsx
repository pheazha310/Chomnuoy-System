import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';

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

export default function OrganizationProfilePage() {
  const session = useMemo(() => getOrganizationSession(), []);
  const storedProfile = useMemo(() => getStoredProfile(), []);
  const organizationName = storedProfile?.name || session?.name || 'Organization';
  const initials = organizationName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'OR';
  const logoUrl = storedProfile?.logo || '';

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

  const mapQuery = encodeURIComponent(
    storedProfile?.mapQuery || storedProfile?.location || 'Passerelles numériques Cambodia (PNC)'
  );
  const profile = {
    name: organizationName,
    joined: storedProfile?.joined || 'October 2021',
    about:
      storedProfile?.about ||
      'We are dedicated to preserving global biodiversity through community-led conservation and advocacy. Our programs range from reforestation initiatives to ecosystem restoration and wildlife corridor mapping.',
    contact: {
      email: storedProfile?.email || session?.email || 'contact@chomnuoy.org',
      phone: storedProfile?.phone || '+1 (555) 123-4567',
      location:
        storedProfile?.location ||
        'Passerelles numériques Cambodia (PNC), BP 511, Phum Tropeang Chhuk (Borey Sorla) Sangtak, Street 371, Phnom Penh, Cambodia',
      website: storedProfile?.website || 'www.chomnuoy.org',
    },
    stats: [
      { label: 'Total Campaigns', value: storedProfile?.totalCampaigns || '124' },
      { label: 'Total Donations', value: storedProfile?.totalDonations || '$2.4M' },
      { label: 'Number of Donors', value: storedProfile?.totalDonors || '8,902' },
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
            {logoUrl ? (
              <img src={logoUrl} alt={`${profile.name} logo`} className="org-profile-logo-img" />
            ) : (
              <span className="org-profile-logo" aria-hidden="true">{initials}</span>
            )}
            <div>
              <h1>{profile.name}</h1>
            </div>
          </div>
          <div className="org-profile-header-actions">
            <Link to="/organization/profile/edit" className="org-profile-edit-btn">
              Edit Profile
            </Link>
          </div>
        </section>

        <section className="org-profile-grid">
          <div className="org-profile-left">
            <article className="org-profile-card">
              <div className="org-profile-card-head">
                <h2>About {profile.name}</h2>
                <span className="org-profile-meta">Joined {profile.joined}</span>
              </div>
              <p className="org-profile-body">{profile.about}</p>
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
                <span className="org-profile-meta">{profile.contact.location}</span>
              </div>
              <iframe
                title="PNC Map"
                className="org-profile-map-embed"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
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
