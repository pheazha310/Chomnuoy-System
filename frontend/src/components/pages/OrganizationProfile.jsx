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
          <h1>{organization.name}</h1>
          <p className="profile-category">{organization.category || organization.type || 'General'}</p>
          <div className="profile-rating">
            <span className="rating-stars">★ {organization.rating || '4.5'}</span>
            <span className="review-count">({organization.reviews || organization.review_count || 0} reviews)</span>
          </div>
          <p className="profile-location">
            {organization.location || organization.address || 'Location not specified'}
          </p>
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

        <section className="profile-section">
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
    </main>
  );
}

export default OrganizationProfile;
