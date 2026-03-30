import { useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import {

  PAGE_SIZE,

  RATING_OPTIONS,

  SORT_OPTIONS,

  getPaginationItems,

  organizations,

} from './organizationShared';

import '../css/organization.css';



function OrganizationBeforeLogin() {

  const location = useLocation();

  const navigate = useNavigate();



  const [searchInput, setSearchInput] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('all');

  const [ratingFilter, setRatingFilter] = useState('4plus');

  const [sortBy, setSortBy] = useState('recent');

  const [currentPage, setCurrentPage] = useState(1);

  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const [isRatingMenuOpen, setIsRatingMenuOpen] = useState(false);

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);



  const categoryMenuRef = useRef(null);

  const ratingMenuRef = useRef(null);

  const sortMenuRef = useRef(null);



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

        const searchableText = `${organization.name} ${organization.summary} ${organization.tags.join(' ')}`.toLowerCase();

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



  const paginatedOrganizations = useMemo(() => {

    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredOrganizations.slice(start, start + PAGE_SIZE);

  }, [filteredOrganizations, currentPage]);



  const categoryLabel = selectedCategory === 'all' ? 'All Categories' : selectedCategory;

  const ratingLabel = RATING_OPTIONS.find((option) => option.value === ratingFilter)?.label || 'All Ratings';

  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label || 'Most Recent';

  const hasActiveSearch = searchTerm.trim().length > 0;



  useEffect(() => {

    setCurrentPage(1);

  }, [searchTerm, selectedCategory, ratingFilter, sortBy]);



  useEffect(() => {

    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));

  }, [totalPages]);



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

              setRatingFilter('4plus');

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

        {paginatedOrganizations.map((organization) => (

          <article key={organization.id} className="organization-card">

            <img src={organization.image} alt={organization.name} />

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

        <button type="button" aria-label="Previous page" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>

          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="pagination-icon">

            <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

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

          )

        )}

        <button type="button" aria-label="Next page" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>

          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="pagination-icon">

            <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

          </svg>

        </button>

      </nav>

    </main>

  );

}



export default OrganizationBeforeLogin;

