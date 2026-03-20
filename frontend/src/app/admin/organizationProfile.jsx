import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminSidebar from './adminsidebar';
import './organization.css';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '$0';
  return `$${amount.toLocaleString('en-US')}`;
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
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AdminOrganizationProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  const getStorageFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    const appBase = apiBase.replace(/\/api\/?$/, '');
    return `${appBase}/storage/${path}`;
  };

  useEffect(() => {
    let mounted = true;
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    async function load() {
      setLoading(true);
      setError('');
      try {
        const results = await Promise.allSettled([
          fetch(`${apiBase}/organizations/${id}`, { headers }),
          fetch(`${apiBase}/categories`, { headers }),
          fetch(`${apiBase}/campaigns`, { headers }),
          fetch(`${apiBase}/donations`, { headers }),
          fetch(`${apiBase}/organization_reports/financial_summary?organization_id=${id}`, { headers }),
        ]);

        const organizationResponse = results[0].status === 'fulfilled' ? results[0].value : null;
        const categoriesResponse = results[1].status === 'fulfilled' ? results[1].value : null;
        const campaignsResponse = results[2].status === 'fulfilled' ? results[2].value : null;
        const donationsResponse = results[3].status === 'fulfilled' ? results[3].value : null;
        const financialSummaryResponse = results[4].status === 'fulfilled' ? results[4].value : null;

        if (!organizationResponse?.ok) {
          const status = organizationResponse?.status ?? 'request';
          throw new Error(`Failed to load organization (${status})`);
        }

        const organizationData = await organizationResponse.json();
        const categoriesData = categoriesResponse?.ok ? await categoriesResponse.json() : [];
        const campaignsData = campaignsResponse?.ok ? await campaignsResponse.json() : [];
        const donationsData = donationsResponse?.ok ? await donationsResponse.json() : [];
        const financialSummaryData = financialSummaryResponse?.ok ? await financialSummaryResponse.json() : null;

        if (!mounted) return;

        setOrganization(organizationData);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
        setDonations(Array.isArray(donationsData) ? donationsData : []);
        setFinancialSummary(financialSummaryData);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load organization.');
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
  }, [apiBase, id]);

  const categoryLookup = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      if (category?.id) {
        map.set(Number(category.id), category.category_name || category.name || '');
      }
    });
    return map;
  }, [categories]);

  const profile = useMemo(() => {
    if (!organization) return null;

    const organizationId = Number(organization.id || 0);
    const relatedCampaigns = campaigns.filter((item) => Number(item.organization_id) === organizationId);
    const relatedDonations = donations.filter((item) => Number(item.organization_id) === organizationId);
    const fallbackDonorCount = new Set(
      relatedDonations.map((item) => Number(item.user_id)).filter(Boolean),
    ).size;
    const fallbackTotalRaised = relatedDonations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const donorCount = Number(financialSummary?.metrics?.active_donors?.value ?? fallbackDonorCount);
    const totalRaised = Number(financialSummary?.metrics?.total_revenue?.value ?? fallbackTotalRaised);
    const avatarUrl =
      organization.avatar_url ||
      organization.logo_url ||
      organization.image_url ||
      getStorageFileUrl(organization.avatar_path);

    return {
      id: organizationId,
      name: organization.name || 'Organization',
      email: organization.email || '-',
      phone: organization.phone || 'Not provided',
      website: organization.website || 'Not provided',
      location: organization.location || 'Not provided',
      description: organization.description || 'No description has been added yet.',
      joined: formatDate(organization.created_at),
      status: normalizeStatus(organization.verified_status || organization.status),
      type: normalizeType(categoryLookup.get(Number(organization.category_id)) || organization.category || organization.type || ''),
      avatarUrl,
      campaigns: relatedCampaigns.length,
      donors: donorCount,
      totalRaised,
    };
  }, [campaigns, categoryLookup, donations, financialSummary, organization]);

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return (
    <div className="admin-shell admin-org-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main admin-org-main">
        <header className="admin-org-header">
          <div>
            <h1>Organization Profile</h1>
            <p>Review organization details, verification state, and activity summary.</p>
          </div>
          <div className="admin-org-profile-actions">
            <button type="button" className="admin-org-ghost-btn" onClick={() => navigate('/admin/organizations')}>
              Back to Organizations
            </button>
          </div>
        </header>

        {loading ? <div className="admin-org-empty">Loading organization...</div> : null}
        {!loading && error ? <div className="admin-org-empty is-error">{error}</div> : null}
        {!loading && !error && profile ? (
          <section className="admin-org-profile-card">
            <div className="admin-org-profile-hero">
              <div className="admin-org-profile-avatar">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span>{getInitials(profile.name)}</span>}
              </div>
              <div className="admin-org-profile-summary">
                <h2>{profile.name}</h2>
                <p>{profile.email}</p>
                <div className="admin-org-profile-badges">
                  <span className={`admin-org-pill admin-org-pill-${profile.type.toLowerCase().replace(/\s+/g, '-')}`}>{profile.type}</span>
                  <span className={`admin-org-status admin-org-status-${profile.status.toLowerCase()}`}>{profile.status}</span>
                </div>
              </div>
            </div>

            <div className="admin-org-profile-grid">
              <div>
                <span>Organization ID</span>
                <p>ORG-{String(profile.id).padStart(4, '0')}</p>
              </div>
              <div>
                <span>Joined</span>
                <p>{profile.joined}</p>
              </div>
              <div>
                <span>Location</span>
                <p>{profile.location}</p>
              </div>
              <div>
                <span>Phone</span>
                <p>{profile.phone}</p>
              </div>
            </div>

            <div className="admin-org-profile-sections">
              <article className="admin-org-profile-section">
                <div className="admin-org-profile-section-title">
                  <span className="admin-org-profile-section-icon" aria-hidden="true">i</span>
                  <span>Organization Overview</span>
                </div>
                <p className="admin-org-profile-description">{profile.description}</p>
                <div className="admin-org-profile-info-list">
                  <div className="admin-org-profile-info-row">
                    <span>Email</span>
                    <strong>{profile.email}</strong>
                  </div>
                  <div className="admin-org-profile-info-row">
                    <span>Website</span>
                    <strong>{profile.website}</strong>
                  </div>
                </div>
              </article>

              <article className="admin-org-profile-section">
                <div className="admin-org-profile-section-title">
                  <span className="admin-org-profile-section-icon" aria-hidden="true">#</span>
                  <span>Activity Snapshot</span>
                </div>
                <div className="admin-org-profile-metrics">
                  <div className="admin-org-profile-metric">
                    <span>Campaigns</span>
                    <strong>{profile.campaigns}</strong>
                  </div>
                  <div className="admin-org-profile-metric">
                    <span>Donors</span>
                    <strong>{profile.donors}</strong>
                  </div>
                  <div className="admin-org-profile-metric">
                    <span>Total Raised</span>
                    <strong>{formatMoney(profile.totalRaised)}</strong>
                  </div>
                </div>
              </article>
            </div>
          </section>
        ) : null}
      </main>

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
