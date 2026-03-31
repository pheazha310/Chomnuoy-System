import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminSidebar from './adminsidebar';
import './user.css';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

function normalizeRoleLabel(raw) {
  return raw || 'User';
}

function normalizeStatusLabel(raw) {
  if (!raw) return 'Active';
  const text = String(raw).trim();
  if (!text) return 'Active';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function statusTone(raw) {
  const value = String(raw || '').toLowerCase();
  if (value.includes('pending')) return 'pending';
  if (value.includes('inactive') || value.includes('suspend')) return 'inactive';
  return 'active';
}

export default function AdminUserProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
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
        const [userResponse, rolesResponse] = await Promise.all([
          fetch(`${apiBase}/users/${id}`, { headers }),
          fetch(`${apiBase}/roles`, { headers }),
        ]);

        if (!userResponse.ok) {
          throw new Error(`Failed to load user (${userResponse.status})`);
        }

        const userData = await userResponse.json();
        const rolesData = rolesResponse.ok ? await rolesResponse.json() : [];

        if (mounted) {
          setUser(userData);
          setRoles(Array.isArray(rolesData) ? rolesData : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load user.');
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

  const roleLookup = useMemo(() => {
    const map = new Map();
    roles.forEach((role) => {
      if (role?.id) {
        map.set(Number(role.id), role.role_name || role.name || '');
      }
    });
    return map;
  }, [roles]);

  const avatarUrl = useMemo(() => {
    if (!user) return '';
    return (
      user.avatar_url ||
      user.profile_image ||
      user.avatar ||
      user.image_url ||
      user.photo ||
      user.picture ||
      getStorageFileUrl(user.avatar_path)
    );
  }, [user, apiBase]);

  const initials = useMemo(() => {
    const name = user?.name || 'User';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [user]);

  const roleName = useMemo(() => {
    if (!user) return 'User';
    const raw = roleLookup.get(Number(user.role_id)) || user.role || '';
    return normalizeRoleLabel(raw);
  }, [roleLookup, user]);

  const userStatus = useMemo(() => normalizeStatusLabel(user?.status), [user]);
  const userStatusTone = useMemo(() => statusTone(user?.status), [user]);

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/';
  };

  return (
    <div className="admin-shell admin-user-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main admin-user-main">
        <header className="admin-user-header">
          <div>
            <p className="admin-user-kicker">User Directory</p>
            <h1>User Profile</h1>
            <p>Review account details, contact information, and account state.</p>
          </div>
          <div className="admin-user-header-actions">
            <button type="button" className="admin-user-ghost-btn" onClick={() => navigate('/admin/users')}>
              Back to Users
            </button>
          </div>
        </header>

        {loading ? (
          <div className="admin-user-empty admin-user-state-card">
            <strong>Loading user</strong>
            <span>Fetching account information and profile details.</span>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="admin-user-empty admin-user-state-card is-error">
            <strong>Unable to load user</strong>
            <span>{error}</span>
          </div>
        ) : null}

        {!loading && !error && user ? (
          <section className="admin-user-profile-card">
            <div className="admin-user-profile-hero">
              <div className="admin-user-profile-header">
                <div className="admin-user-profile-avatar">
                  {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
                </div>
                <div className="admin-user-profile-heading">
                  <span className="admin-user-profile-eyebrow">Account Overview</span>
                  <h2>{user.name || 'Unknown'}</h2>
                  <p>{user.email || '-'}</p>
                  <div className="admin-user-profile-badges">
                    <span className="admin-user-profile-badge">{roleName}</span>
                    <span className={`admin-user-profile-badge is-${userStatusTone}`}>{userStatus}</span>
                    <span className="admin-user-profile-badge is-muted">Joined {formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="admin-user-profile-hero-note">
                <span>Profile Snapshot</span>
                <strong>{user.phone || 'No phone number saved'}</strong>
                <p>Use this page to verify identity, role assignment, and overall account readiness.</p>
              </div>
            </div>

            <div className="admin-user-profile-grid">
              <div>
                <span>Role</span>
                <p>{roleName}</p>
              </div>
              <div>
                <span>Status</span>
                <p className={`admin-user-profile-status is-${userStatusTone}`}>{userStatus}</p>
              </div>
              <div>
                <span>Joined</span>
                <p>{formatDate(user.created_at)}</p>
              </div>
              <div>
                <span>User ID</span>
                <p>{user.id}</p>
              </div>
            </div>

            <div className="admin-user-profile-layout">
              <div className="admin-user-profile-section">
                <div className="admin-user-profile-section-title">
                  <span className="admin-user-profile-section-icon" aria-hidden="true">PI</span>
                  <span>Personal Information</span>
                </div>
                <div className="admin-user-profile-info-list">
                  <div className="admin-user-profile-info-row">
                    <span>Full Name</span>
                    <strong>{user.name || 'Unknown'}</strong>
                  </div>
                  <div className="admin-user-profile-info-row">
                    <span>Email Address</span>
                    <strong>{user.email || '-'}</strong>
                  </div>
                  <div className="admin-user-profile-info-row">
                    <span>Phone Number</span>
                    <strong>{user.phone || 'Not provided'}</strong>
                  </div>
                </div>
              </div>

              <div className="admin-user-profile-section">
                <div className="admin-user-profile-section-title">
                  <span className="admin-user-profile-section-icon" aria-hidden="true">AC</span>
                  <span>Account Details</span>
                </div>
                <div className="admin-user-profile-info-list">
                  <div className="admin-user-profile-info-row">
                    <span>Account ID</span>
                    <strong>{user.id}</strong>
                  </div>
                  <div className="admin-user-profile-info-row">
                    <span>Role Assignment</span>
                    <strong>{roleName}</strong>
                  </div>
                  <div className="admin-user-profile-info-row">
                    <span>Profile Image</span>
                    <strong>{avatarUrl ? 'Uploaded' : 'Not uploaded'}</strong>
                  </div>
                </div>
              </div>

              <aside className="admin-user-profile-sidecard">
                <div className="admin-user-profile-sidecard-head">
                  <span>Admin Notes</span>
                  <strong>Quick review</strong>
                </div>
                <ul className="admin-user-profile-checklist">
                  <li>{user.email ? 'Email address is available.' : 'Email address is missing.'}</li>
                  <li>{user.phone ? 'Phone number is on file.' : 'Phone number still needs to be added.'}</li>
                  <li>{userStatusTone === 'active' ? 'Account is ready for normal access.' : 'Account may need admin attention.'}</li>
                </ul>
              </aside>
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
