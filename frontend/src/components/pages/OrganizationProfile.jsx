import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/organization.css';

const FALLBACK_ORGANIZATION_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="%23EAF2FF"/><circle cx="120" cy="110" r="44" fill="%232563EB" opacity="0.16"/><circle cx="535" cy="82" r="58" fill="%232563EB" opacity="0.1"/><circle cx="500" cy="282" r="74" fill="%232563EB" opacity="0.08"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="%231E3A5F">Organization</text></svg>';

function OrganizationProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    async function fetchOrganization() {
      try {
        setLoading(true);
        const response = await fetch(`${apiBase}/organizations/${id}`);
        if (!response.ok) {
          throw new Error('Organization not found');
        }
        const data = await response.json();
        setOrganization(data.data || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchOrganization();
    }
  }, [id, apiBase]);

  function handleDonate() {
    const redirect = encodeURIComponent(`/organizations/donate/${id}`);
    navigate(`/login?redirect=${redirect}`);
  }

  if (loading) {
    return (
      <main className="organization-profile">
        <div className="loading-container">
          <p>Loading organization profile...</p>
        </div>
      </main>
    );
  }

  if (error || !organization) {
    return (
      <main className="organization-profile">
        <div className="error-container">
          <h2>Organization Not Found</h2>
          <p>{error || 'The organization you are looking for does not exist.'}</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/organizations')}>
            Back to Organizations
          </button>
        </div>
      </main>
    );
  }

  const imageUrl = organization.avatar_url || organization.logo || organization.image || FALLBACK_ORGANIZATION_IMAGE;

  return (
    <main className="organization-profile">
      <div className="profile-header">
        <div className="profile-cover">
          <img
            src={imageUrl}
            alt={organization.name}
            className="profile-image"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_ORGANIZATION_IMAGE;
            }}
          />
        </div>
        <div className="profile-info">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {organization.name}
            {organization.verified_status === 'approved' && (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ background: '#fff', borderRadius: '50%', padding: '2px' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
          </h1>
          <p className="profile-category">{organization.category || organization.type || 'General'}</p>
          <div className="profile-meta">
            <div className="profile-rating">
              <span className="rating-stars">★ {organization.rating || '4.5'}</span>
              <span className="review-count">({organization.reviews || organization.review_count || 0} reviews)</span>
            </div>
            <p className="profile-location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {organization.location || organization.address || 'Location not specified'}
            </p>
          </div>
        </div>
        <div className="profile-actions">
          <button type="button" className="btn-primary" onClick={handleDonate}>
            Donate Now
          </button>
          <button type="button" className="btn-outline" onClick={() => navigate('/organizations')}>
            Back to List
          </button>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-main">
          <section className="profile-section">
            <h2>About</h2>
            <p>{organization.mission || organization.description || organization.summary || 'No description available.'}</p>
          </section>

          {organization.vision && (
            <section className="profile-section">
              <h2>Vision</h2>
              <p>{organization.vision}</p>
            </section>
          )}
        </div>

        <div className="profile-sidebar">
          <section className="profile-section contact-card" style={{ marginBottom: '1.5rem' }}>
            <h2>Organization Details</h2>
            <div className="contact-grid">
              <div className="contact-item">
                <strong>Status:</strong>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  background: organization.verified_status === 'approved' ? '#dcfce7' : '#fef08a',
                  color: organization.verified_status === 'approved' ? '#166534' : '#854d0e',
                  borderRadius: '99px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  marginTop: '4px',
                  width: 'fit-content'
                }}>
                  {organization.verified_status === 'approved' ? 'Verified Partner' : 'Pending Verification'}
                </span>
              </div>
              <div className="contact-item">
                <strong>Member Since:</strong>
                <span>
                  {organization.created_at
                    ? new Date(organization.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Recently joined'}
                </span>
              </div>
              <div className="contact-item" style={{ marginTop: '0.4rem' }}>
                <strong>Location:</strong>
                <span>{organization.location || organization.address || 'Location not specified'}</span>
              </div>
            </div>
          </section>

          <section className="profile-section contact-card">
            <h2>Contact Information</h2>
            <div className="contact-grid">
              {organization.email && (
                <div className="contact-item">
                  <strong>Email:</strong> {organization.email}
                </div>
              )}
              {organization.phone && (
                <div className="contact-item">
                  <strong>Phone:</strong> {organization.phone}
                </div>
              )}
              {organization.website && (
                <div className="contact-item">
                  <strong>Website:</strong>{' '}
                  <a href={organization.website} target="_blank" rel="noopener noreferrer">
                    {organization.website}
                  </a>
                </div>
              )}
            </div>
          </section>

          {organization.tags && organization.tags.length > 0 && (
            <section className="profile-section">
              <h2>Focus Areas</h2>
              <div className="tags">
                {organization.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default OrganizationProfile;
