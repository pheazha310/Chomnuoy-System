import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../css/organization.css';

function OrganizationProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For now, use the mock data from OrganizationBeforeLogin
  // In production, this would fetch from API: /api/organizations/${id}
  useEffect(() => {
    // Import the organizations data dynamically
    import('../components/pages/organizationShared').then((module) => {
      const foundOrg = module.organizations.find((org) => org.id === parseInt(id, 10));
      if (foundOrg) {
        setOrganization(foundOrg);
      } else {
        setError('Organization not found');
      }
      setLoading(false);
    });
  }, [id]);

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
