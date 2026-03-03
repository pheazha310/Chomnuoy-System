import { useEffect, useMemo, useRef, useState } from 'react';
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

const PAGE_SIZE = 3;

function getPaginationItems(totalPages, currentPage) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const validPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const items = [];

  for (let index = 0; index < validPages.length; index += 1) {
    const page = validPages[index];
    const previousPage = validPages[index - 1];

    if (index > 0 && page - previousPage > 1) {
      items.push('...');
    }

    items.push(page);
  }

  return items;
}

function Organization() {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('4plus');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef(null);

  const categoryOptions = useMemo(() => {
    const categories = new Set();
    organizations.forEach((organization) => {
      organization.tags.forEach((tag) => categories.add(tag));
    });
    return [...categories].sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredOrganizations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = organizations
      .filter((organization) => {
        if (!query) return true;
        const searchableText =
          `${organization.name} ${organization.summary} ${organization.tags.join(' ')}`.toLowerCase();
        return searchableText.includes(query);
      })
      .filter((organization) => {
        if (selectedCategory === 'all') return true;
        return organization.tags.includes(selectedCategory);
      })
      .filter((organization) => {
        if (ratingFilter === 'all') return true;
        if (ratingFilter === '45plus') return organization.rating >= 4.5;
        return organization.rating >= 4;
      });

    return filtered.sort((left, right) => {
      if (sortBy === 'oldest') return left.id - right.id;
      if (sortBy === 'ratingHigh') return right.rating - left.rating;
      if (sortBy === 'ratingLow') return left.rating - right.rating;
      if (sortBy === 'nameAZ') return left.name.localeCompare(right.name);
      if (sortBy === 'nameZA') return right.name.localeCompare(left.name);
      return right.id - left.id;
    });
  }, [searchTerm, selectedCategory, ratingFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredOrganizations.length / PAGE_SIZE));
  const paginationItems = useMemo(() => getPaginationItems(totalPages, currentPage), [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, ratingFilter, sortBy]);

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setIsCategoryMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsCategoryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const paginatedOrganizations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrganizations.slice(start, start + PAGE_SIZE);
  }, [filteredOrganizations, currentPage]);
  const categoryLabel = selectedCategory === 'all' ? 'All Categories' : selectedCategory;
  const hasActiveSearch = searchTerm.trim().length > 0;

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
  };

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
        <div className="search-wrap">
          <input
            className="search-input"
            type="search"
            placeholder="Search organizations by name, mission, or keyword..."
            aria-label="Search organizations"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <button type="button" className="search-btn" aria-label="Search organizations" onClick={handleSearch}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="5.5" />
              <path d="M16 16L20 20" />
            </svg>
          </button>
        </div>
        {hasActiveSearch ? (
          <p className="search-result-note">
            Showing {filteredOrganizations.length} result{filteredOrganizations.length === 1 ? '' : 's'} for "
            {searchTerm}"
          </p>
        ) : null}
        <div className="filter-row">
          <div className="category-filter" ref={categoryMenuRef}>
            <button
              type="button"
              className="filter-select category-trigger"
              aria-haspopup="listbox"
              aria-expanded={isCategoryMenuOpen}
              aria-label="Filter by category"
              onClick={() => setIsCategoryMenuOpen((open) => !open)}
            >
              {categoryLabel}
            </button>
            {isCategoryMenuOpen ? (
              <ul className="category-menu" role="listbox" aria-label="Categories">
                <li>
                  <button
                    type="button"
                    className={`category-option ${selectedCategory === 'all' ? 'category-option-active' : ''}`}
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsCategoryMenuOpen(false);
                    }}
                  >
                    All Categories
                  </button>
                </li>
                {categoryOptions.map((category) => (
                  <li key={category}>
                    <button
                      type="button"
                      className={`category-option ${selectedCategory === category ? 'category-option-active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsCategoryMenuOpen(false);
                      }}
                    >
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <select
            className="filter-select"
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.target.value)}
          >
            <option value="all">All Ratings</option>
            <option value="4plus">Rating: 4+ Stars</option>
            <option value="45plus">Rating: 4.5+ Stars</option>
          </select>
          <select className="filter-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
            <option value="ratingHigh">Rating: High to Low</option>
            <option value="ratingLow">Rating: Low to High</option>
            <option value="nameAZ">Name: A to Z</option>
            <option value="nameZA">Name: Z to A</option>
          </select>
          <button
            className="clear-filters"
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearchTerm('');
              setSelectedCategory('all');
              setRatingFilter('4plus');
              setSortBy('recent');
            }}
          >
            Clear Filters
          </button>
        </div>
      </section>

      <section className="organization-grid" aria-label="Organization List">
        {paginatedOrganizations.map((organization) => (
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

      {filteredOrganizations.length === 0 ? <p>No organizations found for "{searchTerm}".</p> : null}

      <nav className="pagination" aria-label="Pagination">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          disabled={currentPage === 1}
        >
          {'<'}
        </button>
        {paginationItems.map((item, index) =>
          item === '...' ? (
            <span key={`ellipsis-${index}`}>...</span>
          ) : (
            <button
              key={item}
              type="button"
              className={currentPage === item ? 'active' : ''}
              aria-current={currentPage === item ? 'page' : undefined}
              onClick={() => setCurrentPage(item)}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          aria-label="Next page"
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          disabled={currentPage === totalPages}
        >
          {'>'}
        </button>
      </nav>
    </main>
  );
}

export default Organization;

