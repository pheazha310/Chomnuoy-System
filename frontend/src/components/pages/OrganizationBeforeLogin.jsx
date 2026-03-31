import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PAGE_SIZE,
  RATING_OPTIONS,
  SORT_OPTIONS,
  getPaginationItems,
} from './organizationShared';
import ROUTES from '@/constants/routes.js';
import '../css/organization.css';

const FALLBACK_ORGANIZATION_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="%23EAF2FF"/><circle cx="120" cy="110" r="44" fill="%232563EB" opacity="0.16"/><circle cx="535" cy="82" r="58" fill="%232563EB" opacity="0.1"/><circle cx="500" cy="282" r="74" fill="%232563EB" opacity="0.08"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="%231E3A5F">Organization</text></svg>';

function getStoredOrganizationProfile() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_org_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getOrganizationSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildCandidateApiBases() {
  const configuredApiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const runtimeApiBase = `${window.location.protocol}//${window.location.hostname}:8000/api`;

  return [
    configuredApiBase,
    runtimeApiBase,
    'http://127.0.0.1:8000/api',
    'http://localhost:8000/api',
  ].filter((value, index, array) => value && array.indexOf(value) === index);
}

function getStorageFileUrl(path, apiBase) {
  if (!path) return '';

  const rawPath = String(path).trim();
  if (
    rawPath.startsWith('http://') ||
    rawPath.startsWith('https://') ||
    rawPath.startsWith('blob:') ||
    rawPath.startsWith('data:')
  ) {
    return rawPath;
  }

  const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const appBase = apiBase.replace(/\/api\/?$/, '');
  if (normalizedPath.startsWith('storage/')) {
    return `${appBase}/${normalizedPath}`;
  }

  return `${appBase}/storage/${normalizedPath}`;
}

function mapOrganizations(items, apiBase, campaigns = []) {
  const storedProfile = getStoredOrganizationProfile();
  const session = getOrganizationSession();
  const sessionOrganizationId = Number(session?.organizationId ?? session?.userId ?? 0);
  const storedProfileName = String(storedProfile?.name || session?.name || '').trim().toLowerCase();
  const storedProfileEmail = String(storedProfile?.email || session?.email || '').trim().toLowerCase();
  const storedProfileLogo = String(storedProfile?.logo || storedProfile?.logoUrl || '').trim();
  const campaignImageMap = new Map();

  (Array.isArray(campaigns) ? campaigns : []).forEach((campaign) => {
    const organizationId = Number(campaign?.organization_id || campaign?.organizationId || 0);
    if (!organizationId || campaignImageMap.has(organizationId)) return;

    const image = getStorageFileUrl(
      campaign?.image_path || campaign?.image || campaign?.image_url,
      apiBase,
    );

    if (image) {
      campaignImageMap.set(organizationId, image);
    }
  });

  return (Array.isArray(items) ? items : []).map((item) => {
    const rating = Number(item.rating ?? 4.5);
    const reviews = item.reviews ?? item.review_count ?? '\u2014';
    const tags = Array.isArray(item.tags)
      ? item.tags
      : [item.category_name || item.category || item.type || item.location || 'General'].filter(Boolean);
    const itemId = Number(item.id || 0);
    const itemName = String(item.name || '').trim().toLowerCase();
    const itemEmail = String(item.email || '').trim().toLowerCase();
    const matchesStoredProfile =
      Boolean(storedProfileLogo) &&
      ((sessionOrganizationId > 0 && itemId === sessionOrganizationId) ||
        (storedProfileEmail && itemEmail && storedProfileEmail === itemEmail) ||
        (storedProfileName && itemName && storedProfileName === itemName));

    return {
      id: item.id,
      name: item.name || 'Organization',
      summary: item.mission || item.summary || item.description || 'No description available.',
      tags,
      rating: Number.isFinite(rating) ? rating : 4.5,
      reviews,
      image:
        getStorageFileUrl(
          item.avatar_url || item.avatar_path || item.logo || item.logo_path || item.image_path || item.cover_image,
          apiBase,
        ) ||
        (matchesStoredProfile ? storedProfileLogo : '') ||
        campaignImageMap.get(Number(item.id)) ||
        getStorageFileUrl(item.banner_path || item.photo || item.image_url, apiBase) ||
        FALLBACK_ORGANIZATION_IMAGE,
    };
  });
}

function buildCampaignSearchPath(organization) {
  const params = new URLSearchParams();
  if (organization?.name) {
    params.set('search', organization.name);
  }
  const query = params.toString();
  return query ? `${ROUTES.CAMPAIGNS}?${query}` : ROUTES.CAMPAIGNS;
}

function buildViewProfileLoginPath(organization) {
  const redirectTarget = organization?.name
    ? `${ROUTES.ORGANIZATIONS}?search=${encodeURIComponent(organization.name)}`
    : ROUTES.ORGANIZATIONS;
  return `${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectTarget)}`;
}

function OrganizationBeforeLogin() {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isRatingMenuOpen, setIsRatingMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categoryMenuRef = useRef(null);
  const ratingMenuRef = useRef(null);
  const sortMenuRef = useRef(null);

  const categoryOptions = useMemo(() => {
    const categories = new Set();
    organizations.forEach((organization) => {
      (organization.tags || []).forEach((tag) => categories.add(tag));
    });
    return [...categories].sort((a, b) => a.localeCompare(b));
  }, [organizations]);

  const filteredOrganizations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = organizations
      .filter((organization) => {
        if (!query) return true;
        const searchableText = `${organization.name} ${organization.summary} ${(organization.tags || []).join(' ')}`.toLowerCase();
        return searchableText.includes(query);
      })
      .filter((organization) => {
        if (selectedCategory === 'all') return true;
        return (organization.tags || []).includes(selectedCategory);
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
  }, [organizations, ratingFilter, searchTerm, selectedCategory, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredOrganizations.length / PAGE_SIZE));
  const paginationItems = useMemo(() => getPaginationItems(totalPages, currentPage), [currentPage, totalPages]);

  const paginatedOrganizations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrganizations.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredOrganizations]);

  const categoryLabel = selectedCategory === 'all' ? 'All Categories' : selectedCategory;
  const ratingLabel = RATING_OPTIONS.find((option) => option.value === ratingFilter)?.label || 'All Ratings';
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label || 'Most Recent';
  const hasActiveSearch = searchTerm.trim().length > 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [ratingFilter, searchTerm, selectedCategory, sortBy]);

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const candidateApiBases = buildCandidateApiBases();

    const loadOrganizations = async () => {
      let lastError = 'Failed to load organizations.';

      for (const apiBase of candidateApiBases) {
        try {
          const [organizationsResponse, campaignsResponse] = await Promise.all([
            fetch(`${apiBase}/organizations`),
            fetch(`${apiBase}/campaigns`).catch(() => null),
          ]);

          if (!organizationsResponse.ok) {
            throw new Error(`Failed to load organizations (${organizationsResponse.status}) from ${apiBase}`);
          }

          const organizationsData = await organizationsResponse.json();
          const campaignsData =
            campaignsResponse && campaignsResponse.ok
              ? await campaignsResponse.json()
              : [];
          const items = Array.isArray(organizationsData) ? organizationsData : [];

          if (!active) return;

          setOrganizations(mapOrganizations(items, apiBase, campaignsData));
          setError(items.length === 0 ? `No organizations were returned from ${apiBase}.` : '');
          return;
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Failed to load organizations.';
        }
      }

      if (!active) return;
      setOrganizations([]);
      setError(lastError);
    };

    loadOrganizations().finally(() => {
      if (!active) return;
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search).get('search')?.trim() || '';
    setSearchInput(query);
    setSearchTerm(query);
  }, [location.search]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setIsCategoryMenuOpen(false);
      }
      if (ratingMenuRef.current && !ratingMenuRef.current.contains(event.target)) {
        setIsRatingMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsCategoryMenuOpen(false);
        setIsRatingMenuOpen(false);
        setIsSortMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

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
              onClick={() => {
                setIsCategoryMenuOpen((open) => !open);
                setIsRatingMenuOpen(false);
                setIsSortMenuOpen(false);
              }}
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
          <div className="category-filter" ref={ratingMenuRef}>
            <button
              type="button"
              className="filter-select category-trigger"
              aria-haspopup="listbox"
              aria-expanded={isRatingMenuOpen}
              aria-label="Filter by rating"
              onClick={() => {
                setIsRatingMenuOpen((open) => !open);
                setIsCategoryMenuOpen(false);
                setIsSortMenuOpen(false);
              }}
            >
              {ratingLabel}
            </button>
            {isRatingMenuOpen ? (
              <ul className="category-menu" role="listbox" aria-label="Ratings">
                {RATING_OPTIONS.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={`category-option ${ratingFilter === option.value ? 'category-option-active' : ''}`}
                      onClick={() => {
                        setRatingFilter(option.value);
                        setIsRatingMenuOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="category-filter" ref={sortMenuRef}>
            <button
              type="button"
              className="filter-select category-trigger"
              aria-haspopup="listbox"
              aria-expanded={isSortMenuOpen}
              aria-label="Sort organizations"
              onClick={() => {
                setIsSortMenuOpen((open) => !open);
                setIsCategoryMenuOpen(false);
                setIsRatingMenuOpen(false);
              }}
            >
              {sortLabel}
            </button>
            {isSortMenuOpen ? (
              <ul className="category-menu" role="listbox" aria-label="Sort options">
                {SORT_OPTIONS.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={`category-option ${sortBy === option.value ? 'category-option-active' : ''}`}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortMenuOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button
            className="clear-filters"
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearchTerm('');
              setSelectedCategory('all');
              setRatingFilter('all');
              setSortBy('recent');
              setIsCategoryMenuOpen(false);
              setIsRatingMenuOpen(false);
              setIsSortMenuOpen(false);
            }}
          >
            Clear Filters
          </button>
        </div>
      </section>

      <section className="organization-grid" aria-label="Organization List">
        {loading ? <p>Loading organizations...</p> : null}
        {error ? <p className="text-red-500">{error}</p> : null}
        {paginatedOrganizations.map((organization) => (
          <article key={organization.id} className="organization-card">
            <img
              src={organization.image || FALLBACK_ORGANIZATION_IMAGE}
              alt={organization.name}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_ORGANIZATION_IMAGE;
              }}
            />
            <div className="card-body">
              <p className="rating">
                <span aria-hidden="true">*</span> {organization.rating} <span className="reviews">({organization.reviews})</span>
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
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate(buildCampaignSearchPath(organization))}
                >
                  Donate
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => navigate(buildViewProfileLoginPath(organization))}
                >
                  View Profile
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {!loading && !error && filteredOrganizations.length === 0 ? (
        <p>No organizations found for "{searchTerm}".</p>
      ) : null}

      <nav className="pagination" aria-label="Pagination">
        <button type="button" aria-label="Previous page" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="pagination-icon">
            <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
          ),
        )}
        <button type="button" aria-label="Next page" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="pagination-icon">
            <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </nav>
    </main>
  );
}

export default OrganizationBeforeLogin;
