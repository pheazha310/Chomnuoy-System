import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../css/organization.css';

const FALLBACK_ORGANIZATION_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="%23EAF2FF"/><circle cx="120" cy="110" r="44" fill="%232563EB" opacity="0.16"/><circle cx="535" cy="82" r="58" fill="%232563EB" opacity="0.1"/><circle cx="500" cy="282" r="74" fill="%232563EB" opacity="0.08"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="%231E3A5F">Organization</text></svg>';

function OrganizationProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleDonate = () => {
    navigate(`/login?redirect=/organizations/donate/${id}`);
  };

  if (loading) {
    return (
      <main className="organizations-content">
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
      </main>
    );
  }

  if (error || !organization) {
    return (
      <main className="organizations-content">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Organization not found</h2>
          <Link to="/organizations" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Back to Organizations
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="organizations-content">
      <section className="organizations-header">
        <Link
          to="/organizations"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            color: '#4b5563',
            textDecoration: 'none',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Organizations
        </Link>
      </section>

      <div className="organization-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <img src={organization.image} alt={organization.name} style={{ height: '300px', objectFit: 'cover' }} />
        <div className="card-body">
          <p className="rating">
            <span aria-hidden="true">*</span> {organization.rating}{' '}
            <span className="reviews">({organization.reviews} reviews)</span>
          </p>
          <h1>{organization.name}</h1>
          <p className="summary">{organization.summary}</p>
          <div className="tags" style={{ marginBottom: '1.5rem' }}>
            {organization.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
          <div className="card-actions">
            <button type="button" className="btn-primary" onClick={handleDonate}>
              Donate Now
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default OrganizationProfile;
