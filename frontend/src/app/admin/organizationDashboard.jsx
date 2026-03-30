import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowUpRight, Building2, CheckCircle2, Clock3, Eye, Filter, MapPin, MoreVertical, PencilLine, Search, ShieldCheck, UserX } from 'lucide-react';
import AdminSidebar from './adminsidebar';
import { deactivateAccount, updateOrganizationProfile } from '@/services/user-service.js';
import './organization.css';

const ORGANIZATIONS_CACHE_KEY = 'admin_organization_dashboard_orgs_cache';
const CATEGORIES_CACHE_KEY = 'admin_organization_dashboard_categories_cache';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

function readCache(key) {
  try {
    const raw = window.sessionStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed?.timestamp || !Array.isArray(parsed?.data)) {
      return [];
    }
    if (Date.now() - parsed.timestamp > CACHE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(key);
      return [];
    }
    return parsed.data;
  } catch {
    return [];
  }
}

function writeCache(key, data) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data: Array.isArray(data) ? data : [],
    }));
  } catch {
    // Ignore storage write failures.
  }
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

function getInitials(name) {
  return String(name || 'Organization')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function OrganizationDashboard() {
  const navigate = useNavigate();
  const cachedOrganizations = readCache(ORGANIZATIONS_CACHE_KEY);
  const cachedCategories = readCache(CATEGORIES_CACHE_KEY);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [organizations, setOrganizations] = useState(cachedOrganizations);
  const [categories, setCategories] = useState(cachedCategories);
  const [loading, setLoading] = useState(cachedOrganizations.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: '', email: '', location: '', status: '' });
  const [actionError, setActionError] = useState('');
  const [actionSaving, setActionSaving] = useState(false);
  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/';
  };

  const openActionModal = (type, org) => {
    setOpenMenuId(null);
    setActionError('');
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
    setActionError('');
    setActionSaving(false);
    setActionModal(null);
  };

  const openOrganizationDetails = (organizationId) => {
    setOpenMenuId(null);
    navigate(`/admin/organizations/${organizationId}`);
  };

  const handleEditSave = async () => {
    if (!actionModal?.org?.id) return;
    setActionError('');

    try {
      setActionSaving(true);
      const formData = new FormData();
      formData.append('name', editDraft.name || actionModal.org.name || '');
      formData.append('email', editDraft.email || actionModal.org.email || '');
      formData.append('location', editDraft.location || actionModal.org.location || '');
      formData.append('verified_status', editDraft.status || actionModal.org.status || 'Pending');

      const updated = await updateOrganizationProfile(actionModal.org.id, formData);
      const nextStatus = normalizeStatus(updated?.verified_status || updated?.status || editDraft.status);

      setOrganizations((prev) => prev.map((item) => (
        Number(item.id) === Number(actionModal.org.id)
          ? {
              ...item,
              ...updated,
              name: updated?.name ?? editDraft.name,
              email: updated?.email ?? editDraft.email,
              location: updated?.location ?? editDraft.location,
              verified_status: updated?.verified_status ?? nextStatus,
              status: updated?.status ?? nextStatus,
            }
          : item
      )));
      closeActionModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update organization.');
    } finally {
      setActionSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!actionModal?.org?.id) return;
    setActionError('');

    try {
      setActionSaving(true);
      await deactivateAccount({ accountType: 'organization', userId: actionModal.org.id });
      setOrganizations((prev) => prev.filter((item) => Number(item.id) !== Number(actionModal.org.id)));
      closeActionModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to deactivate organization.');
      setActionSaving(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let refreshId;
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const hasCachedOrganizations = cachedOrganizations.length > 0;

    async function load({ silent = false } = {}) {
      if (!silent && !hasCachedOrganizations) {
        setLoading(true);
      }
      if (silent || hasCachedOrganizations) {
        setIsRefreshing(true);
      }
      setError('');
      try {
        const orgResponse = await fetch(`${apiBase}/organizations`, { headers });

        if (!orgResponse.ok) {
          throw new Error(`Failed to load organizations (${orgResponse.status})`);
        }

        const orgData = await orgResponse.json();

        if (mounted) {
          const nextOrganizations = Array.isArray(orgData) ? orgData : [];
          setOrganizations(nextOrganizations);
          writeCache(ORGANIZATIONS_CACHE_KEY, nextOrganizations);
        }

        fetch(`${apiBase}/categories`, { headers })
          .then(async (categoryResponse) => {
            if (!categoryResponse.ok) {
              throw new Error(`Failed to load categories (${categoryResponse.status})`);
            }
            const catData = await categoryResponse.json();
            if (!mounted) return;
            const nextCategories = Array.isArray(catData) ? catData : [];
            setCategories(nextCategories);
            writeCache(CATEGORIES_CACHE_KEY, nextCategories);
          })
          .catch(() => {});
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load organizations');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    load();
    refreshId = window.setInterval(() => load({ silent: true }), 60000);
    return () => {
      mounted = false;
      if (refreshId) {
        window.clearInterval(refreshId);
      }
    };
  }, [apiBase]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest('.admin-org-menu-wrap')) {
        setOpenMenuId(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

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
    const verified = normalizedOrgs.filter((org) => org.status === 'Verified').length;
    const pending = normalizedOrgs.filter((org) => org.status === 'Pending').length;
    const verificationRate = total ? Math.round((verified / total) * 100) : 0;
    return [
      {
        id: 'total',
        label: 'Total Entities',
        value: total.toLocaleString(),
        note: `${verified.toLocaleString()} verified organizations`,
        accent: 'blue',
        Icon: Building2,
      },
      {
        id: 'ngo',
        label: 'NGOs',
        value: ngos.toLocaleString(),
        note: pending ? `${pending.toLocaleString()} pending review` : 'All active records reviewed',
        accent: 'emerald',
        Icon: ShieldCheck,
      },
      {
        id: 'school',
        label: 'Schools',
        value: schools.toLocaleString(),
        note: `${verificationRate}% verification rate`,
        accent: 'amber',
        Icon: Activity,
      },
      {
        id: 'hospital',
        label: 'Hospitals',
        value: hospitals.toLocaleString(),
        note: `${hospitals ? hospitals : 0} medical partners onboarded`,
        accent: 'violet',
        Icon: CheckCircle2,
      },
    ];
  }, [normalizedOrgs]);

  const summary = useMemo(() => {
    const total = normalizedOrgs.length;
    const verified = normalizedOrgs.filter((org) => org.status === 'Verified').length;
    const pending = normalizedOrgs.filter((org) => org.status === 'Pending').length;
    const inactive = normalizedOrgs.filter((org) => org.status === 'Inactive').length;
    const uniqueLocations = new Set(normalizedOrgs.map((org) => org.location).filter((value) => value && value !== '-')).size;

    return {
      total,
      verified,
      pending,
      inactive,
      uniqueLocations,
      verificationRate: total ? Math.round((verified / total) * 100) : 0,
    };
  }, [normalizedOrgs]);

  return (
    <div className="admin-shell admin-org-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main admin-org-main">
        <header className="admin-org-header">
          <div className="admin-org-hero">
            <div className="admin-org-hero-copy">
              <span className="admin-org-eyebrow">Admin Workspace</span>
              <h1>Organization Management</h1>
              <p>Track onboarding, spot pending verifications, and keep partner records clean across the platform.</p>
              <div className="admin-org-hero-chips">
                <span className="admin-org-hero-chip">
                  <CheckCircle2 size={14} />
                  {summary.verified} verified
                </span>
                <span className="admin-org-hero-chip is-warning">
                  <Clock3 size={14} />
                  {summary.pending} pending
                </span>
                <span className="admin-org-hero-chip is-neutral">
                  <MapPin size={14} />
                  {summary.uniqueLocations} locations
                </span>
              </div>
              {isRefreshing && !loading ? <span className="admin-org-refreshing">Refreshing live data...</span> : null}
            </div>

            <div className="admin-org-hero-panel">
              <div className="admin-org-hero-panel-top">
                <span className="admin-org-live-pill">
                  <Activity size={14} />
                  Live overview
                </span>
                <span className="admin-org-hero-rate">{summary.verificationRate}%</span>
              </div>
              <p className="admin-org-hero-panel-label">Verification coverage</p>
              <div className="admin-org-hero-meter" aria-hidden="true">
                <span style={{ width: `${summary.verificationRate}%` }} />
              </div>
              <div className="admin-org-hero-metrics">
                <div>
                  <strong>{summary.total}</strong>
                  <span>Total orgs</span>
                </div>
                <div>
                  <strong>{summary.pending}</strong>
                  <span>Needs review</span>
                </div>
                <div>
                  <strong>{summary.inactive}</strong>
                  <span>Inactive</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="admin-org-stats">
          {stats.map((stat) => (
            <div key={stat.id} className={`admin-org-stat admin-org-stat-${stat.accent}`}>
              <div className="admin-org-stat-top">
                <p>{stat.label}</p>
                <span className="admin-org-stat-icon">
                  <stat.Icon size={16} />
                </span>
              </div>
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
                <span>All Organizations</span>
                <strong>{normalizedOrgs.length}</strong>
              </button>
              <button
                type="button"
                className={filter === 'pending' ? 'is-active' : ''}
                onClick={() => setFilter('pending')}
              >
                <span>Pending</span>
                <strong>{summary.pending}</strong>
              </button>
              <button
                type="button"
                className={filter === 'verified' ? 'is-active' : ''}
                onClick={() => setFilter('verified')}
              >
                <span>Verified</span>
                <strong>{summary.verified}</strong>
              </button>
            </div>
            <div className="admin-org-toolbar-actions">
              <label className="admin-org-search">
                <span aria-hidden="true" className="admin-org-search-icon">
                  <Search size={16} />
                </span>
                <input
                  type="search"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
              <button type="button" className="admin-org-ghost-btn">
                <Filter size={15} />
                Organization Type
              </button>
              <button type="button" className="admin-org-ghost-btn">
                <ArrowUpRight size={15} />
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
            {loading ? (
              <div className="admin-org-skeleton-list" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="admin-org-skeleton-row">
                    <div className="admin-org-skeleton-user">
                      <span className="admin-org-skeleton-avatar" />
                      <div className="admin-org-skeleton-text">
                        <span className="admin-org-skeleton-line admin-org-skeleton-line-name" />
                        <span className="admin-org-skeleton-line admin-org-skeleton-line-email" />
                      </div>
                    </div>
                    <span className="admin-org-skeleton-pill" />
                    <span className="admin-org-skeleton-line admin-org-skeleton-line-location" />
                    <span className="admin-org-skeleton-line admin-org-skeleton-line-date" />
                    <span className="admin-org-skeleton-pill" />
                    <span className="admin-org-skeleton-dots" />
                  </div>
                ))}
              </div>
            ) : null}
            {!loading && error ? <div className="admin-org-empty is-error">{error}</div> : null}
            {!loading && !error && filteredOrgs.length === 0 ? (
              <div className="admin-org-empty">No organizations found.</div>
            ) : null}
            {!loading && !error && filteredOrgs.length > 0 ? (
              filteredOrgs.map((org, index) => {
                const initials = getInitials(org.name);
                const typeClass = org.type.toLowerCase().replace(/\s+/g, '-');
                return (
                  <div
                    key={`${org.name}-${index}`}
                    className="admin-org-row admin-org-row-clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => openOrganizationDetails(org.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openOrganizationDetails(org.id);
                      }
                    }}
                    aria-label={`View details for ${org.name}`}
                  >
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
                          aria-label={`More actions for ${org.name}`}
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === org.id}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === org.id ? (
                          <div className="admin-org-menu" role="menu">
                            <button type="button" role="menuitem" onClick={() => openOrganizationDetails(org.id)}>
                              <Eye size={14} />
                              <span>View Profile</span>
                            </button>
                            <button type="button" role="menuitem" onClick={() => openActionModal('edit', org)}>
                              <PencilLine size={14} />
                              <span>Edit</span>
                            </button>
                            <button type="button" role="menuitem" className="danger" onClick={() => openActionModal('deactivate', org)}>
                              <UserX size={14} />
                              <span>Deactivate</span>
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
                      {getInitials(actionModal.org.name)}
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
                    <div>
                      <span>Profile ID</span>
                      <p>ORG-{String(actionModal.org.id).padStart(4, '0')}</p>
                    </div>
                    <div>
                      <span>Quick Note</span>
                      <p>
                        {actionModal.org.status === 'Pending'
                          ? 'Awaiting verification review.'
                          : actionModal.org.status === 'Verified'
                            ? 'Approved and active on the platform.'
                            : 'Currently inactive.'}
                      </p>
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
                {actionError ? <p className="admin-org-warning">{actionError}</p> : null}
                <div className="admin-modal-actions">
                  <button type="button" className="admin-modal-cancel" onClick={closeActionModal}>
                    Cancel
                  </button>
                  <button type="button" className="admin-user-save" onClick={handleEditSave} disabled={actionSaving}>
                    {actionSaving ? 'Saving...' : 'Save Changes'}
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
                {actionError ? <p className="admin-org-warning">{actionError}</p> : null}
                <div className="admin-modal-actions">
                  <button type="button" className="admin-modal-cancel" onClick={closeActionModal}>
                    Cancel
                  </button>
                  <button type="button" className="admin-user-danger" onClick={handleDeactivate} disabled={actionSaving}>
                    {actionSaving ? 'Deactivating...' : 'Deactivate'}
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
            <p>You will be returned to the public home page.</p>
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

