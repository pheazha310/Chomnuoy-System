import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from './adminsidebar';
import './organization.css';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

function normalizeStatus(raw) {
  const value = String(raw || '').toLowerCase();
  if (value.includes('verified')) return 'Verified';
  if (value.includes('pending')) return 'Pending';
  if (value.includes('inactive')) return 'Inactive';
  return raw ? String(raw) : 'Pending';
}

function normalizeType(raw) {
  const value = String(raw || '').toLowerCase();
  if (value.includes('ngo')) return 'NGO';
  if (value.includes('school')) return 'School';
  if (value.includes('hospital')) return 'Hospital';
  if (value.includes('education')) return 'Education';
  if (value.includes('child support')) return 'Child Support';
  return raw ? String(raw) : 'Organization';
}

export default function OrganizationDashboard() {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: '', email: '', location: '', status: '' });
  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  const openActionModal = (type, org) => {
    setOpenMenuId(null);
    if (type === 'edit') {
      setEditDraft({
        name: org.name || '',
        email: org.email || '',
        location: org.location || '',
        status: org.status || '',
      });
    }
    setActionModal({ type, org });
  };

  const closeActionModal = () => {
    setActionModal(null);
  };

  useEffect(() => {
    let mounted = true;
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [orgResponse, categoryResponse] = await Promise.all([
          fetch(`${apiBase}/organizations`, { headers }),
          fetch(`${apiBase}/categories`, { headers }),
        ]);

        if (!orgResponse.ok) {
          throw new Error(`Failed to load organizations (${orgResponse.status})`);
        }

        const orgData = await orgResponse.json();
        const catData = categoryResponse.ok ? await categoryResponse.json() : [];

        if (mounted) {
          setOrganizations(Array.isArray(orgData) ? orgData : []);
          setCategories(Array.isArray(catData) ? catData : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load organizations');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [apiBase]);

  const categoryLookup = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      if (cat?.id) {
        map.set(Number(cat.id), cat.category_name || cat.name || '');
      }
    });
    return map;
  }, [categories]);

  const normalizedOrgs = useMemo(
    () =>
      organizations.map((org) => {
        const typeName = categoryLookup.get(Number(org.category_id)) || org.category || org.type || '';
        return {
          id: org.id,
          name: org.name || 'Organization',
          email: org.email || '-',
          type: normalizeType(typeName),
          location: org.location || '-',
          joined: formatDate(org.created_at),
          status: normalizeStatus(org.verified_status || org.status),
        };
      }),
    [organizations, categoryLookup]
  );

  const filteredOrgs = useMemo(() => {
    let result = normalizedOrgs;
    if (filter === 'verified') result = result.filter((org) => org.status === 'Verified');
    if (filter === 'pending') result = result.filter((org) => org.status === 'Pending');
    const q = searchTerm.trim().toLowerCase();
    if (!q) return result;
    return result.filter((org) => (
      org.name.toLowerCase().includes(q) ||
      org.email.toLowerCase().includes(q) ||
      org.type.toLowerCase().includes(q) ||
      org.location.toLowerCase().includes(q)
    ));
  }, [filter, normalizedOrgs, searchTerm]);

  const stats = useMemo(() => {
    const total = normalizedOrgs.length;
    const ngos = normalizedOrgs.filter((org) => org.type === 'NGO').length;
    const schools = normalizedOrgs.filter((org) => org.type === 'School').length;
    const hospitals = normalizedOrgs.filter((org) => org.type === 'Hospital').length;
    return [
      { id: 'total', label: 'Total Entities', value: total.toLocaleString(), note: '+12% from last month' },
      { id: 'ngo', label: 'NGOs', value: ngos.toLocaleString(), note: `Verified: ${ngos}` },
      { id: 'school', label: 'Schools', value: schools.toLocaleString(), note: `Verified: ${schools}` },
      { id: 'hospital', label: 'Hospitals', value: hospitals.toLocaleString(), note: `Verified: ${hospitals}` },
    ];
  }, [normalizedOrgs]);

  return (
    <div className="admin-shell admin-org-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main admin-org-main">
        <header className="admin-org-header">
          <div>
            <h1>Organization Management</h1>
            <p>Track and verify organizations onboarded into the platform.</p>
          </div>
        </header>

        <section className="admin-org-stats">
          {stats.map((stat) => (
            <div key={stat.id} className="admin-org-stat">
              <p>{stat.label}</p>
              <h3>{stat.value}</h3>
              <span>{stat.note}</span>
            </div>
          ))}
        </section>

        <section className="admin-org-panel">
          <div className="admin-org-toolbar">
            <div className="admin-org-tabs">
              <button
                type="button"
                className={filter === 'all' ? 'is-active' : ''}
                onClick={() => setFilter('all')}
              >
                All Organizations
              </button>
              <button
                type="button"
                className={filter === 'pending' ? 'is-active' : ''}
                onClick={() => setFilter('pending')}
              >
                Pending
              </button>
              <button
                type="button"
                className={filter === 'verified' ? 'is-active' : ''}
                onClick={() => setFilter('verified')}
              >
                Verified
              </button>
            </div>
            <div className="admin-org-toolbar-actions">
              <label className="admin-org-search">
                <span aria-hidden="true" className="admin-org-search-icon">
                  <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="search"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
              <button type="button" className="admin-org-ghost-btn">
                Organization Type
              </button>
              <button type="button" className="admin-org-ghost-btn">
                More Filters
              </button>
            </div>
          </div>

          <div className="admin-org-table">
            <div className="admin-org-table-head">
              <span>Organization Name</span>
              <span>Type</span>
              <span>Location</span>
              <span>Registration Date</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {loading ? <div className="admin-org-empty">Loading organizations...</div> : null}
            {!loading && error ? <div className="admin-org-empty is-error">{error}</div> : null}
            {!loading && !error && filteredOrgs.length === 0 ? (
              <div className="admin-org-empty">No organizations found.</div>
            ) : null}
            {!loading && !error && filteredOrgs.length > 0 ? (
              filteredOrgs.map((org, index) => {
                const initials = org.name
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                const typeClass = org.type.toLowerCase().replace(/\s+/g, '-');
                return (
                  <div key={`${org.name}-${index}`} className="admin-org-row">
                    <div className="admin-org-cell">
                      <span className="admin-org-avatar">{initials}</span>
                      <div>
                        <p>{org.name}</p>
                        <small>{org.email}</small>
                      </div>
                    </div>
                    <span className={`admin-org-pill admin-org-pill-${typeClass}`}>{org.type}</span>
                    <span>{org.location}</span>
                    <span>{org.joined}</span>
                    <span className={`admin-org-status admin-org-status-${org.status.toLowerCase()}`}>
                      {org.status}
                    </span>
                    <div className="admin-org-actions">
                      <div className="admin-org-menu-wrap" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="admin-org-icon-btn"
                          onClick={() => setOpenMenuId((prev) => (prev === org.id ? null : org.id))}
                          aria-label="More actions"
                        >
                          ⋮
                        </button>
                        {openMenuId === org.id ? (
                          <div className="admin-org-menu">
                            <button type="button" onClick={() => openActionModal('view', org)}>View Profile</button>
                            <button type="button" onClick={() => openActionModal('edit', org)}>Edit</button>
                            <button type="button" className="danger" onClick={() => openActionModal('deactivate', org)}>
                              Deactivate
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : null}
          </div>
        </section>
      </main>

      {actionModal ? (
        <div className="admin-modal-overlay" role="presentation" onClick={closeActionModal}>
          <div
            className="admin-modal admin-org-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-org-action-title"
            onClick={(event) => event.stopPropagation()}
          >
            {actionModal.type === 'view' ? (
              <>
                <h3 id="admin-org-action-title">Organization Profile</h3>
                <div className="admin-org-modal-card">
                  <div className="admin-org-modal-header">
                    <span className="admin-org-modal-avatar" aria-hidden="true">
                      {actionModal.org.name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                    <div>
                      <p>{actionModal.org.name}</p>
                      <span>{actionModal.org.email}</span>
                    </div>
                  </div>
                  <div className="admin-org-modal-grid">
                    <div>
                      <span>Type</span>
                      <p>{actionModal.org.type}</p>
                    </div>
                    <div>
                      <span>Status</span>
                      <p>{actionModal.org.status}</p>
                    </div>
                    <div>
                      <span>Location</span>
                      <p>{actionModal.org.location}</p>
                    </div>
                    <div>
                      <span>Registered</span>
                      <p>{actionModal.org.joined}</p>
                    </div>
                  </div>
                </div>
                <div className="admin-modal-actions">
                  <button type="button" className="admin-modal-cancel" onClick={closeActionModal}>
                    Close
                  </button>
                </div>
              </>
            ) : null}

            {actionModal.type === 'edit' ? (
              <>
                <h3 id="admin-org-action-title">Edit Organization</h3>
                <div className="admin-org-form">
                  <label>
                    Name
                    <input
                      type="text"
                      value={editDraft.name}
                      onChange={(event) => setEditDraft((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={editDraft.email}
                      onChange={(event) => setEditDraft((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </label>
                  <label>
                    Location
                    <input
                      type="text"
                      value={editDraft.location}
                      onChange={(event) => setEditDraft((prev) => ({ ...prev, location: event.target.value }))}
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={editDraft.status}
                      onChange={(event) => setEditDraft((prev) => ({ ...prev, status: event.target.value }))}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Verified">Verified</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </label>
                </div>
                <div className="admin-modal-actions">
                  <button type="button" className="admin-modal-cancel" onClick={closeActionModal}>
                    Cancel
                  </button>
                  <button type="button" className="admin-user-save" onClick={closeActionModal}>
                    Save Changes
                  </button>
                </div>
              </>
            ) : null}

            {actionModal.type === 'deactivate' ? (
              <>
                <h3 id="admin-org-action-title">Deactivate Organization</h3>
                <p className="admin-org-warning">
                  This will disable access for <strong>{actionModal.org.name}</strong> until reactivated.
                </p>
                <div className="admin-modal-actions">
                  <button type="button" className="admin-modal-cancel" onClick={closeActionModal}>
                    Cancel
                  </button>
                  <button type="button" className="admin-user-danger" onClick={closeActionModal}>
                    Deactivate
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {isLogoutOpen ? (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setIsLogoutOpen(false)}>
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-logout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="admin-logout-title">Are you sure you want to logout?</h3>
            <p>You will be returned to the login page.</p>
            <div className="admin-modal-actions">
              <button type="button" className="admin-modal-cancel" onClick={() => setIsLogoutOpen(false)}>
                Cancel
              </button>
              <button type="button" className="admin-modal-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
