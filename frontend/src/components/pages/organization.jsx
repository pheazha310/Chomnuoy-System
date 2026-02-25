import '../css/organization.css';

const organizations = [
  {
    id: 1,
    name: 'Literacy for All',
    summary: 'Empowering underprivileged youth through accessible education and mentorship programs.',
    tags: ['Education', 'Youth'],
    rating: 4.9,
    reviews: '1.2k',
    image:
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 2,
    name: 'Green Earth Initiative',
    summary: 'Focused on reforestation and sustainable farming practices to combat climate change in local communities.',
    tags: ['Environment', 'Climate'],
    rating: 4.7,
    reviews: '856',
    image:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 3,
    name: 'Health First Network',
    summary: 'Providing essential healthcare services and medical supplies to remote villages and urban families in need.',
    tags: ['Health', 'Emergency'],
    rating: 4.8,
    reviews: '520',
    image:
      'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 4,
    name: 'Community Core',
    summary: 'Strengthening community ties through shared resources, local events, and neighborhood collaboration.',
    tags: ['Community', 'Social'],
    rating: 4.6,
    reviews: '342',
    image:
      'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 5,
    name: 'MindWell Alliance',
    summary: 'Dedicated to mental health awareness and counseling support for people facing stress and trauma.',
    tags: ['Health', 'Mental Health'],
    rating: 4.9,
    reviews: '215',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 6,
    name: 'Urban Uplift Foundation',
    summary: 'Transforming urban spaces into thriving hubs of opportunity through grants and training programs.',
    tags: ['Economy', 'Training'],
    rating: 4.5,
    reviews: '189',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=960&q=80',
  },
];

function Organization() {
  return (
    <main className="organizations-content">
      <section className="organizations-header">
        <h1>Our Partner Organizations</h1>
        <p>
          Connecting you with local initiatives making a real difference in education, health, and the
          environment. Join a community of impact-makers.
        </p>
      </section>

      <section className="organizations-controls" aria-label="Organization Filters">
        <input
          className="search-input"
          type="search"
          placeholder="Search organizations by name, mission, or keyword..."
          aria-label="Search organizations"
        />
        <div className="filter-row">
          <select className="filter-select" defaultValue="all">
            <option value="all">All Categories</option>
          </select>
          <select className="filter-select" defaultValue="top">
            <option value="top">Rating: 4+ Stars</option>
          </select>
          <select className="filter-select" defaultValue="recent">
            <option value="recent">Most Recent</option>
          </select>
          <button className="clear-filters" type="button">
            Clear Filters
          </button>
        </div>
      </section>

      <section className="organization-grid" aria-label="Organization List">
        {organizations.map((organization) => (
          <article key={organization.id} className="organization-card">
            <img src={organization.image} alt={organization.name} />
            <div className="card-body">
              <p className="rating">
                <span aria-hidden="true">*</span> {organization.rating}{' '}
                <span className="reviews">({organization.reviews})</span>
              </p>
              <h2>{organization.name}</h2>
              <p className="summary">{organization.summary}</p>
              <div className="tags">
                {organization.tags.map((tag) => (
                  <span key={`${organization.id}-${tag}`} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="card-actions">
                <button type="button" className="btn-primary">
                  Donate
                </button>
                <button type="button" className="btn-outline">
                  View Profile
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <nav className="pagination" aria-label="Pagination">
        <button type="button" aria-label="Previous page">
          {'<'}
        </button>
        <button type="button" className="active" aria-current="page">
          1
        </button>
        <button type="button">2</button>
        <button type="button">3</button>
        <span>...</span>
        <button type="button">12</button>
        <button type="button" aria-label="Next page">
          {'>'}
        </button>
      </nav>
    </main>
  );
}

export default Organization;
