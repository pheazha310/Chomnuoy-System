import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from './adminsidebar';
import './user.css';

const PAGE_SIZE = 8;

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
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
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  const handleMenuToggle = (userId) => {
    setOpenMenuId((prev) => (prev === userId ? null : userId));
  };

  useEffect(() => {
    let mounted = true;
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [usersResponse, rolesResponse] = await Promise.all([
          fetch(`${apiBase}/users`, { headers }),
          fetch(`${apiBase}/roles`, { headers }),
        ]);

        if (!usersResponse.ok) {
          throw new Error(`Failed to load users (${usersResponse.status})`);
        }

        if (!rolesResponse.ok) {
          throw new Error(`Failed to load roles (${rolesResponse.status})`);
        }

        const [usersData, rolesData] = await Promise.all([usersResponse.json(), rolesResponse.json()]);

        if (mounted) {
          setUsers(Array.isArray(usersData) ? usersData : []);
          setRoles(Array.isArray(rolesData) ? rolesData : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load users');
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
        return {
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email || '-',
          rawRole: String(roleName || ''),
          role: normalizeRoleLabel(roleName),
          joined: formatDate(user.created_at),
          status: normalizeStatus(user.status),
        };
      }),
    [users, roleLookup]
  );

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const adminEmail = String(session?.email || '').trim().toLowerCase();
    const withoutAdmins = normalizedUsers.filter((user) => {
      const roleValue = user.rawRole.toLowerCase();
      if (roleValue.includes('admin')) return false;
      if (adminEmail && user.email.toLowerCase() === adminEmail) return false;
      if (user.name.toLowerCase() === 'admin') return false;
      return true;
    });
    if (!q) return withoutAdmins;
    return withoutAdmins.filter((user) => (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q)
    ));
  }, [normalizedUsers, searchTerm, session?.email]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

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
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} />

      <main className="admin-main admin-user-main" onClick={() => setOpenMenuId(null)}>
        <header className="admin-user-header">
          <div>
            <h1>Admin User Management</h1>
            <p>Manage donors and organization representatives.</p>
          </div>
          <div className="admin-user-header-actions">
            <button className="admin-user-primary-btn" type="button">
              <span className="admin-user-btn-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              Add New User
            </button>
          </div>
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
              <div className="admin-user-empty">Loading users...</div>
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
              <div key={user.email} className="admin-user-table-row">
                <div className="admin-user-cell">
                  <span className={`admin-user-avatar admin-user-avatar-${avatarTone}`} aria-hidden="true">
                    <span className="admin-user-initials">
                      {user.name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                  </span>
                  <div>
                    <p>{user.name}</p>
                    <span>{user.email}</span>
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
                      <button type="button" role="menuitem">View Profile</button>
                      <button type="button" role="menuitem">Edit User</button>
                      <button type="button" role="menuitem" className="danger">Deactivate</button>
                    </div>
                  ) : null}
                </div>
              </div>
                );
              })
            ) : null}
          </div>

          <div className="admin-user-footer">
            <span>
              Showing {visibleUsers.length} of {filteredUsers.length} results
            </span>
            <div className="admin-user-pagination">
              <button type="button" disabled={safePage <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                {'<'}
              </button>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, idx) => {
                const pageNumber = idx + 1;
                return (
                  <button
                    type="button"
                    key={pageNumber}
                    className={safePage === pageNumber ? 'is-active' : ''}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
                {'>'}
              </button>
            </div>
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
