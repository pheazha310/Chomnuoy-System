import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './adminsidebar';
import './user.css';

const USERS_CACHE_KEY = 'admin_user_dashboard_users_cache';
const ROLES_CACHE_KEY = 'admin_user_dashboard_roles_cache';
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

function normalizeRoleLabel(raw) {
  return 'User';
}

function normalizeStatus(raw) {
  const value = String(raw || '').toLowerCase();
  if (value.includes('active')) return 'Active';
  if (value.includes('pending')) return 'Pending';
  if (value.includes('inactive')) return 'Inactive';
  return raw ? String(raw) : 'Active';
}

function resolvePresenceStatus(statusValue, lastSeenAt) {
  if (String(statusValue || '').toLowerCase().includes('inactive')) {
    return 'Offline';
  }
  if (!lastSeenAt) {
    return 'Offline';
  }
  const lastSeen = new Date(lastSeenAt);
  if (Number.isNaN(lastSeen.getTime())) return 'Offline';
  const minutesAgo = (Date.now() - lastSeen.getTime()) / 60000;
  return minutesAgo <= 15 ? 'Active' : 'Offline';
}

const StatCard = ({ stat }) => (
  <div className={`admin-user-stat admin-user-stat-${stat.tone}`}>
    <div className="admin-user-stat-icon" aria-hidden="true">
      <span />
    </div>
    <p className="admin-user-stat-label">{stat.label}</p>
    <p className="admin-user-stat-value">{stat.value}</p>
    <span className="admin-user-stat-note">{stat.note}</span>
  </div>
);

export default function UserDashboard() {
  const navigate = useNavigate();
  const cachedUsers = readCache(USERS_CACHE_KEY);
  const cachedRoles = readCache(ROLES_CACHE_KEY);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [users, setUsers] = useState(cachedUsers);
  const [roles, setRoles] = useState(cachedRoles);
  const [loading, setLoading] = useState(cachedUsers.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: '', email: '', role: '', status: '' });
  const [actionError, setActionError] = useState('');
  const [actionSaving, setActionSaving] = useState(false);
  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';
  const sessionEmail = String(session?.email || '').trim().toLowerCase();
  const sessionUserId = Number(session?.userId || 0);
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  const getStorageFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    const appBase = apiBase.replace(/\/api\/?$/, '');
    return `${appBase}/storage/${path}`;
  };

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/';
  };

  const handleMenuToggle = (userId) => {
    setOpenMenuId((prev) => (prev === userId ? null : userId));
  };

  const openActionModal = (type, user) => {
    setOpenMenuId(null);
    setActionError('');
    if (type === 'edit') {
      setEditDraft({
        name: user.name || '',
        email: user.email || '',
        role: user.rawRole || user.role || '',
        status: user.status || '',
        password: '',
        confirmPassword: '',
        forceReset: false,
      });
    }
    setActionModal({ type, user });
  };

  const closeActionModal = () => {
    setActionModal(null);
  };

  const handleEditSave = async () => {
    if (!actionModal?.user?.id) return;
    setActionError('');

    if (editDraft.password && editDraft.password !== editDraft.confirmPassword) {
      setActionError('Passwords do not match.');
      return;
    }

    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const payload = new FormData();
    payload.append('_method', 'PUT');
    payload.append('name', editDraft.name || actionModal.user.name || '');
    payload.append('email', editDraft.email || actionModal.user.email || '');
    if (editDraft.status) {
      payload.append('status', editDraft.status);
    }
    if (editDraft.password) {
      payload.append('password', editDraft.password);
      payload.append('password_confirmation', editDraft.confirmPassword || '');
    }

    try {
      setActionSaving(true);
      const response = await fetch(`${apiBase}/users/${actionModal.user.id}`, {
        method: 'POST',
        headers,
        body: payload,
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const fallbackMessage = errorPayload?.message || 'Unable to update user.';
        throw new Error(fallbackMessage);
      }

      const updated = await response.json();
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      closeActionModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update user.');
    } finally {
      setActionSaving(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let refreshId;
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const hasCachedUsers = cachedUsers.length > 0;

    async function load({ silent = false } = {}) {
      if (!silent && !hasCachedUsers) {
        setLoading(true);
      }
      if (silent || hasCachedUsers) {
        setIsRefreshing(true);
      }
      setError('');
      try {
        const usersResponse = await fetch(`${apiBase}/users`, { headers });

        if (!usersResponse.ok) {
          throw new Error(`Failed to load users (${usersResponse.status})`);
        }

        const usersData = await usersResponse.json();

        if (mounted) {
          const nextUsers = Array.isArray(usersData) ? usersData : [];
          setUsers(nextUsers);
          writeCache(USERS_CACHE_KEY, nextUsers);
        }

        fetch(`${apiBase}/roles`, { headers })
          .then(async (rolesResponse) => {
            if (!rolesResponse.ok) {
              throw new Error(`Failed to load roles (${rolesResponse.status})`);
            }
            const rolesData = await rolesResponse.json();
            if (!mounted) return;
            const nextRoles = Array.isArray(rolesData) ? rolesData : [];
            setRoles(nextRoles);
            writeCache(ROLES_CACHE_KEY, nextRoles);
          })
          .catch(() => {});
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load users');
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

  const roleLookup = useMemo(() => {
    const map = new Map();
    roles.forEach((role) => {
      if (role?.id) {
        map.set(Number(role.id), role.role_name || role.name || '');
      }
    });
    return map;
  }, [roles]);

  const normalizedUsers = useMemo(
    () =>
      users.map((user) => {
        const roleName = roleLookup.get(Number(user.role_id)) || user.role || '';
        const avatarUrl =
          user.avatar_url ||
          user.profile_image ||
          user.avatar ||
          user.image_url ||
          user.photo ||
          user.picture ||
          getStorageFileUrl(user.avatar_path);
        const roleLabel = String(roleName || '').toLowerCase();
        const userEmail = String(user.email || '').trim().toLowerCase();
        const userId = Number(user.id || 0);
        const isCurrentAccount = (sessionEmail && userEmail === sessionEmail) || (sessionUserId && userId === sessionUserId);
        const displayEmail = isCurrentAccount ? 'Hidden' : (user.email || '-');
        return {
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email || '-',
          displayEmail,
          phone: user.phone || '',
          avatarUrl,
          rawRole: String(roleName || ''),
          isAdmin: roleLabel.includes('admin'),
          role: normalizeRoleLabel(roleName),
          joined: formatDate(user.created_at),
          status: resolvePresenceStatus(user.status, user.last_seen_at),
        };
      }),
    [users, roleLookup, apiBase]
  );

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return normalizedUsers;
    return normalizedUsers.filter((user) => (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q)
    ));
  }, [normalizedUsers, searchTerm]);

  const visibleUsers = filteredUsers;

  const userStats = useMemo(() => {
    const total = normalizedUsers.length;
    const activeCount = normalizedUsers.filter((user) => user.status === 'Active').length;
    const pendingCount = normalizedUsers.filter((user) => user.status === 'Pending').length;
    return [
      { id: 'total', label: 'Total Users', value: total.toLocaleString(), note: 'All accounts', tone: 'blue' },
      { id: 'active', label: 'Active Users', value: activeCount.toLocaleString(), note: 'Currently active', tone: 'green' },
      { id: 'pending', label: 'Pending Users', value: pendingCount.toLocaleString(), note: 'Awaiting approval', tone: 'orange' },
    ];
  }, [normalizedUsers]);

  return (
    <div className="admin-shell admin-user-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main admin-user-main" onClick={() => setOpenMenuId(null)}>
        <header className="admin-user-header">
          <div>
            <h1 style={{fontSize:'35px'}}>Admin User Management</h1>
            <p>Manage donors and organization representatives.</p>
            {isRefreshing && !loading ? <span className="admin-user-refreshing">Refreshing data...</span> : null}
          </div>
          {/* <div className="admin-user-header-actions">
            <button className="admin-user-primary-btn" type="button">
              <span className="admin-user-btn-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              Add New User
            </button>
          </div> */}
        </header>

        <section className="admin-user-stats">
          {userStats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </section>

        <section className="admin-user-panel">
          <div className="admin-user-toolbar">
            <label className="admin-user-search">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search users by name, email or role..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <div className="admin-user-actions">
              <button type="button" className="admin-user-ghost-btn">
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 6h16M8 12h8M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                Filter
              </button>
              <button type="button" className="admin-user-ghost-btn">
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                Export
              </button>
            </div>
          </div>

          <div className="admin-user-table">
            <div className="admin-user-table-head">
              <span>User</span>
              <span>Role</span>
              <span>Joined Date</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {loading ? (
              <div className="admin-user-skeleton-list" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="admin-user-skeleton-row">
                    <div className="admin-user-skeleton-user">
                      <span className="admin-user-skeleton-avatar" />
                      <div className="admin-user-skeleton-text">
                        <span className="admin-user-skeleton-line admin-user-skeleton-line-name" />
                        <span className="admin-user-skeleton-line admin-user-skeleton-line-email" />
                      </div>
                    </div>
                    <span className="admin-user-skeleton-pill" />
                    <span className="admin-user-skeleton-line admin-user-skeleton-line-date" />
                    <span className="admin-user-skeleton-pill" />
                    <span className="admin-user-skeleton-dots" />
                  </div>
                ))}
              </div>
            ) : null}
            {!loading && error ? (
              <div className="admin-user-empty is-error">{error}</div>
            ) : null}
            {!loading && !error && visibleUsers.length === 0 ? (
              <div className="admin-user-empty">No users found.</div>
            ) : null}
            {!loading && !error && visibleUsers.length > 0 ? (
              visibleUsers.map((user, index) => {
                const avatarTone = ['blue', 'orange', 'gray', 'pink'][index % 4];
                return (
              <div
                key={user.email}
                className="admin-user-table-row admin-user-row-clickable"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/admin/users/${user.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    navigate(`/admin/users/${user.id}`);
                  }
                }}
              >
                <div className="admin-user-cell">
                  <span className={`admin-user-avatar admin-user-avatar-${avatarTone}`} aria-hidden="true">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" />
                    ) : (
                      <span className="admin-user-initials">
                        {user.name
                          .split(' ')
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                    )}
                  </span>
                  <div className="admin-user-profile-copy">
                    <p className="admin-user-profile-name">{user.name}</p>
                    <span className="admin-user-profile-email">{user.displayEmail}</span>
                    {user.phone ? <small className="admin-user-phone">{user.phone}</small> : null}
                  </div>
                </div>
                <span className="admin-user-role admin-user-role-user">
                  {user.role}
                </span>
                <span>{user.joined}</span>
                <span className={`admin-user-status admin-user-status-${user.status.toLowerCase()}`}>
                  {user.status}
                </span>
                <div className="admin-user-actions-cell" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className={`admin-user-more${openMenuId === user.id ? ' is-open' : ''}`}
                    aria-label="More actions"
                    onClick={() => handleMenuToggle(user.id)}
                  >
                    <span />
                    <span />
                    <span />
                  </button>
                  {openMenuId === user.id ? (
                    <div className="admin-user-menu" role="menu">
                      <button type="button" role="menuitem" onClick={() => navigate(`/admin/users/${user.id}`)}>
                        View Profile
                      </button>
                      <button type="button" role="menuitem" onClick={() => openActionModal('edit', user)}>Edit User</button>
                      <button type="button" role="menuitem" className="danger" onClick={() => openActionModal('deactivate', user)}>
                        Deactivate
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
                );
              })
            ) : null}
          </div>

        </section>
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

      {actionModal ? (
        <div className="admin-modal-overlay admin-user-action-overlay" role="presentation" onClick={closeActionModal}>
          <div
            className="admin-modal admin-user-action-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-action-title"
            onClick={(event) => event.stopPropagation()}
          >
            {actionModal.type === 'view' ? (
              <>
                <h3 id="admin-user-action-title">User Profile</h3>
                <div className="admin-user-action-card">
                  <div className="admin-user-action-header">
                    <span className="admin-user-action-avatar" aria-hidden="true">
                      {actionModal.user.avatarUrl ? (
                        <img src={actionModal.user.avatarUrl} alt="" />
                      ) : (
                        actionModal.user.name
                          .split(' ')
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      )}
                    </span>
                    <div>
                      <p>{actionModal.user.name}</p>
                      <span>{actionModal.user.email}</span>
                    </div>
                  </div>
                  <div className="admin-user-action-grid">
                    <div>
                      <span>Role</span>
                      <p>{actionModal.user.rawRole || actionModal.user.role || 'User'}</p>
                    </div>
                    <div>
                      <span>Status</span>
                      <p>{actionModal.user.status}</p>
                    </div>
                    <div>
                      <span>Joined</span>
                      <p>{actionModal.user.joined}</p>
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
                <h3 id="admin-user-action-title">Edit User</h3>
                <div className="admin-user-form">
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
                    Role
                    <input
                      type="text"
                      value={editDraft.role}
                      onChange={(event) => setEditDraft((prev) => ({ ...prev, role: event.target.value }))}
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={editDraft.status}
                      onChange={(event) => setEditDraft((prev) => ({ ...prev, status: event.target.value }))}
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </label>
                  <div className="admin-user-form-separator">
                    <span>Password</span>
                    <p>Set a temporary password or force reset on next login.</p>
                  </div>
                  <label>
                    New Password
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={editDraft.password || ''}
                      onChange={(event) => setEditDraft((prev) => ({ ...prev, password: event.target.value }))}
                    />
                  </label>
                  <label>
                    Confirm Password
                    <input
                      type="password"
                      placeholder="Re-type new password"
                      value={editDraft.confirmPassword || ''}
                      onChange={(event) => setEditDraft((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    />
                  </label>
                  <label className="admin-user-checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(editDraft.forceReset)}
                      onChange={(event) => setEditDraft((prev) => ({ ...prev, forceReset: event.target.checked }))}
                    />
                    Require password reset on next login
                  </label>
                </div>
                {actionError ? <p className="admin-user-form-error">{actionError}</p> : null}
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
                <h3 id="admin-user-action-title">Deactivate User</h3>
                <p className="admin-user-action-warning">
                  This will disable access for <strong>{actionModal.user.name}</strong> until they are reactivated.
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
    </div>
  );
}

