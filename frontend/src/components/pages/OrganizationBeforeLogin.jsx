function OrganizationBeforeLogin({
  searchInput,
  setSearchInput,
  handleSearch,
  hasActiveSearch,
  filteredOrganizations,
  searchTerm,
  categoryMenuRef,
  isCategoryMenuOpen,
  setIsCategoryMenuOpen,
  setIsRatingMenuOpen,
  setIsSortMenuOpen,
  categoryLabel,
  selectedCategory,
  setSelectedCategory,
  categoryOptions,
  ratingMenuRef,
  isRatingMenuOpen,
  ratingLabel,
  ratingFilter,
  setRatingFilter,
  RATING_OPTIONS,
  sortMenuRef,
  isSortMenuOpen,
  sortLabel,
  sortBy,
  setSortBy,
  SORT_OPTIONS,
  paginatedOrganizations,
  paginationItems,
  currentPage,
  setCurrentPage,
  totalPages,
  setSearchInputAndTerm,
}) {
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
              setSearchInputAndTerm();
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
