function OrganizationAfterLogin({
  donorSession,
  isDonationModalOpen,
  donorCategoryMenuRef,
  isDonorCategoryMenuOpen,
  setIsDonorCategoryMenuOpen,
  setIsDonorRegionMenuOpen,
  donorCategoryLabel,
  donorCategories,
  donorCategory,
  setDonorCategory,
  donorRegionMenuRef,
  isDonorRegionMenuOpen,
  donorRegionLabel,
  donorRegions,
  donorRegion,
  setDonorRegion,
  donorVerifiedOnly,
  setDonorVerifiedOnly,
  donorTaxEligibleOnly,
  setDonorTaxEligibleOnly,
  donorSearchInput,
  setDonorSearchInput,
  setDonorSearchTerm,
  setDonorSortBy,
  openDonationModal,
  closeDonationModal,
  selectedDonationOrg,
  DONATION_PRESET_AMOUNTS,
  selectedDonationAmount,
  customDonationAmount,
  setSelectedDonationAmount,
  setCustomDonationAmount,
  hasInvalidCustomAmount,
  DONATION_PAYMENT_METHODS,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  donationMessage,
  setDonationMessage,
  handleConfirmDonation,
  donationAmount,
  donorSortMenuRef,
  isDonorSortMenuOpen,
  setIsDonorSortMenuOpen,
  donorSortLabel,
  DONOR_SORT_OPTIONS,
  donorSortBy,
  donorPaginatedOrganizations,
  favoriteIds,
  setFavoriteIds,
  donorPaginationItems,
  donorPage,
  setDonorPage,
  donorTotalPages,
}) {
  return (
    <main className="donor-org-page">
      <div className={isDonationModalOpen ? 'donor-org-layout donor-org-layout-donation' : 'donor-org-layout'}>
        <aside className="donor-org-sidebar">
          <section className="donor-org-panel donor-user-panel">
            <div className="donor-user-head">
              <img
                src={donorSession.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80'}
                alt={donorSession.name || 'Donor'}
              />
              <div>
                <p>Welcome back,</p>
                <strong>{donorSession.name || 'Alex Rivera'}</strong>
              </div>
            </div>
            <div className="donor-user-stat">
              <span>Total Impact</span>
              <strong>$4,820.00</strong>
            </div>
            <div className="donor-user-stat">
              <span>Causes Supported</span>
              <strong>14</strong>
            </div>
          </section>

          <section className="donor-org-panel donor-filter-panel" aria-label="Filter Results">
            <h3>Filter Results</h3>

            <label className="donor-filter-label" htmlFor="donor-category">
              Category
            </label>
            <div className="category-filter donor-filter-dropdown" ref={donorCategoryMenuRef}>
              <button
                id="donor-category"
                type="button"
                className="filter-select category-trigger"
                aria-haspopup="listbox"
                aria-expanded={isDonorCategoryMenuOpen}
                aria-label="Filter donor category"
                onClick={() => {
                  setIsDonorCategoryMenuOpen((open) => !open);
                  setIsDonorRegionMenuOpen(false);
                }}
              >
                {donorCategoryLabel}
              </button>
              {isDonorCategoryMenuOpen ? (
                <ul className="category-menu" role="listbox" aria-label="Donor categories">
                  {donorCategories.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className={`category-option ${donorCategory === item ? 'category-option-active' : ''}`}
                        onClick={() => {
                          setDonorCategory(item);
                          setIsDonorCategoryMenuOpen(false);
                        }}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <label className="donor-filter-label" htmlFor="donor-region">
              Province / Region
            </label>
            <div className="category-filter donor-filter-dropdown" ref={donorRegionMenuRef}>
              <button
                id="donor-region"
                type="button"
                className="filter-select category-trigger"
                aria-haspopup="listbox"
                aria-expanded={isDonorRegionMenuOpen}
                aria-label="Filter donor region"
                onClick={() => {
                  setIsDonorRegionMenuOpen((open) => !open);
                  setIsDonorCategoryMenuOpen(false);
                }}
              >
                {donorRegionLabel}
              </button>
              {isDonorRegionMenuOpen ? (
                <ul className="category-menu" role="listbox" aria-label="Donor regions">
                  {donorRegions.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className={`category-option ${donorRegion === item ? 'category-option-active' : ''}`}
                        onClick={() => {
                          setDonorRegion(item);
                          setIsDonorRegionMenuOpen(false);
                        }}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <p className="donor-filter-label">Verification Status</p>
            <label className="donor-check">
              <input
                type="checkbox"
                checked={donorVerifiedOnly}
                onChange={(event) => setDonorVerifiedOnly(event.target.checked)}
              />
              Verified Impact
            </label>
            <label className="donor-check">
              <input
                type="checkbox"
                checked={donorTaxEligibleOnly}
                onChange={(event) => setDonorTaxEligibleOnly(event.target.checked)}
              />
              Tax Receipt Eligible
            </label>

            <input
              className="donor-filter-search"
              type="search"
              placeholder="Search organizations..."
              value={donorSearchInput}
              onChange={(event) => setDonorSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setDonorSearchTerm(donorSearchInput.trim());
                }
              }}
            />

            <button type="button" className="donor-apply-btn" onClick={() => setDonorSearchTerm(donorSearchInput.trim())}>
              Apply Filters
            </button>
            <button
              type="button"
              className="donor-clear-btn"
              onClick={() => {
                setDonorSearchInput('');
                setDonorSearchTerm('');
                setDonorCategory('All Categories');
                setDonorRegion('Everywhere');
                setDonorVerifiedOnly(true);
                setDonorTaxEligibleOnly(false);
                setDonorSortBy('recent');
                setIsDonorCategoryMenuOpen(false);
                setIsDonorRegionMenuOpen(false);
                setIsDonorSortMenuOpen(false);
              }}
            >
              Clear all
            </button>
          </section>
        </aside>

        <section className="donor-org-main">
          {isDonationModalOpen && selectedDonationOrg ? (
            <section className="donation-modal-overlay" onClick={closeDonationModal}>
              <article className="donation-modal-card" aria-label="Organization donation form" onClick={(event) => event.stopPropagation()}>
                <header className="donation-modal-head">
                  <div className="donation-modal-title-wrap">
                    <span className="donation-modal-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M12 14V4" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M8.5 7.5L12 4l3.5 3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div>
                      <strong>Donate</strong>
                      <p>Make a difference today</p>
                    </div>
                  </div>
                  <button type="button" className="donation-modal-close" aria-label="Close donation panel" onClick={closeDonationModal}>
                    &times;
                  </button>
                </header>

                <div className="donation-modal-body">
                  <section className="donation-supporting">
                    <p>YOU ARE SUPPORTING</p>
                    <h2>{selectedDonationOrg.name}</h2>
                    <span>Your contribution directly supports educational supplies and scholarships for underprivileged students.</span>
                  </section>

                  <section className="donation-section">
                    <h3>Select Donation Amount</h3>
                    <div className="donation-amount-grid">
                      {DONATION_PRESET_AMOUNTS.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          className={selectedDonationAmount === amount && customDonationAmount.trim() === '' ? 'is-active' : ''}
                          onClick={() => {
                            setSelectedDonationAmount(amount);
                            setCustomDonationAmount('');
                          }}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="donation-section">
                    <h3>Custom Amount</h3>
                    <label className="donation-custom-input">
                      <span className="donation-input-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3.5" y="6.5" width="17" height="11" rx="2.2" strokeWidth="1.8" />
                          <circle cx="12" cy="12" r="2.2" strokeWidth="1.8" />
                          <path d="M7 9.8h.01M17 14.2h.01" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        placeholder="Enter amount in USD"
                        value={customDonationAmount}
                        onChange={(event) => setCustomDonationAmount(event.target.value)}
                      />
                      <span className="donation-input-suffix">USD</span>
                    </label>
                    {hasInvalidCustomAmount ? <p className="donation-field-error">Enter a valid amount greater than 0.</p> : null}
                  </section>

                  <section className="donation-section">
                    <h3>Payment Method</h3>
                    <div className="donation-payment-grid">
                      {DONATION_PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          className={selectedPaymentMethod === method.id ? 'is-active' : ''}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                        >
                          <span className={`payment-badge ${method.badgeClassName}`}>{method.badge}</span>
                          <span>{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="donation-section">
                    <h3>Message to Organization</h3>
                    <textarea
                      placeholder="Write a short message of encouragement or specific instructions..."
                      value={donationMessage}
                      onChange={(event) => setDonationMessage(event.target.value)}
                    />
                  </section>
                </div>

                <div className="donation-modal-footer">
                  <button
                    type="button"
                    className="donation-confirm-btn"
                    onClick={handleConfirmDonation}
                    disabled={hasInvalidCustomAmount || donationAmount <= 0}
                  >
                    <span aria-hidden="true">&#10084;</span> Confirm Donation (${donationAmount})
                  </button>
                  <p className="donation-note">
                    By clicking confirm, you agree to our Terms of Service. 100% of your donation (minus payment processing fees)
                    goes directly to the organization.
                  </p>
                </div>
              </article>
            </section>
          ) : null}

          {!isDonationModalOpen ? (
            <div className="donor-main-content">
              <header className="donor-org-header">
                <div>
                  <h1>Browse Organizations</h1>
                  <p>Discover 1,248 verified non-profit organizations</p>
                </div>
                <div className="donor-sort-wrap" ref={donorSortMenuRef}>
                  <span>Sort by:</span>
                  <div className="category-filter donor-sort-filter">
                    <button
                      type="button"
                      className="filter-select category-trigger donor-sort-trigger"
                      aria-haspopup="listbox"
                      aria-expanded={isDonorSortMenuOpen}
                      aria-label="Sort donor organizations"
                      onClick={() => setIsDonorSortMenuOpen((open) => !open)}
                    >
                      {donorSortLabel}
                    </button>
                    {isDonorSortMenuOpen ? (
                      <ul className="category-menu donor-sort-menu" role="listbox" aria-label="Donor sort options">
                        {DONOR_SORT_OPTIONS.map((option) => (
                          <li key={option.value}>
                            <button
                              type="button"
                              className={`category-option ${donorSortBy === option.value ? 'category-option-active' : ''}`}
                              onClick={() => {
                                setDonorSortBy(option.value);
                                setIsDonorSortMenuOpen(false);
                              }}
                            >
                              {option.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </header>

              <section className="donor-org-grid" aria-label="Organization List">
                {donorPaginatedOrganizations.map((organization) => {
                  const isFavorite = favoriteIds.has(organization.id);
                  return (
                    <article key={organization.id} className="donor-org-card">
                      <div className="donor-org-image-wrap">
                        <img src={organization.image} alt={organization.name} />
                        <div className="donor-org-badges">
                          <span>{organization.category.toUpperCase()}</span>
                          {organization.verified ? <strong>Verified</strong> : null}
                        </div>
                      </div>
                      <div className="donor-org-card-body">
                        <div className="donor-org-title-row">
                          <h2>{organization.name}</h2>
                          <button
                            type="button"
                            className={`donor-favorite ${isFavorite ? 'is-active' : ''}`}
                            aria-label="Toggle favorite"
                            onClick={() =>
                              setFavoriteIds((previous) => {
                                const next = new Set(previous);
                                if (next.has(organization.id)) {
                                  next.delete(organization.id);
                                } else {
                                  next.add(organization.id);
                                }
                                return next;
                              })
                            }
                          >
                            &#9829;
                          </button>
                        </div>
                        <p>{organization.summary}</p>
                        <div className="donor-org-metrics">
                          <div>
                            <span>{organization.metricLeftLabel}</span>
                            <strong>{organization.metricLeftValue}</strong>
                          </div>
                          <div>
                            <span>{organization.metricRightLabel}</span>
                            <strong>{organization.metricRightValue}</strong>
                          </div>
                        </div>
                        <div className="donor-org-actions">
                          <button type="button" className="donor-donate-btn" onClick={() => openDonationModal(organization)}>
                            Donate
                          </button>
                          <button type="button" className="donor-follow-btn" aria-label="Follow organization">
                            Follow
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>

              <nav className="donor-org-pagination" aria-label="Pagination">
                <button type="button" onClick={() => setDonorPage((page) => Math.max(1, page - 1))} disabled={donorPage === 1}>
                  {'<'}
                </button>
                {donorPaginationItems.map((item, index) =>
                  item === '...' ? (
                    <span key={`donor-ellipsis-${index}`}>...</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={donorPage === item ? 'active' : ''}
                      aria-current={donorPage === item ? 'page' : undefined}
                      onClick={() => setDonorPage(item)}
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setDonorPage((page) => Math.min(donorTotalPages, page + 1))}
                  disabled={donorPage === donorTotalPages}
                >
                  {'>'}
                </button>
              </nav>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default OrganizationAfterLogin;
