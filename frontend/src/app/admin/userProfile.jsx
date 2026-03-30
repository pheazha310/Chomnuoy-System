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
            <h1>User Profile</h1>
            <p>View account profile details.</p>
          </div>
          <div className="admin-user-header-actions">
            <button type="button" className="admin-user-ghost-btn" onClick={() => navigate('/admin/users')}>
              Back to Users
            </button>
          </div>
        </header>

        {loading ? <div className="admin-user-empty">Loading user...</div> : null}
        {!loading && error ? <div className="admin-user-empty is-error">{error}</div> : null}
        {!loading && !error && user ? (
          <section className="admin-user-profile-card">
            <div className="admin-user-profile-header">
              <div className="admin-user-profile-avatar">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
              </div>
              <div>
                <h2>{user.name || 'Unknown'}</h2>
                <p>{user.email || '-'}</p>
                {user.phone ? <small>{user.phone}</small> : null}
              </div>
            </div>

            <div className="admin-user-profile-grid">
              <div>
                <span>Role</span>
                <p>{roleName}</p>
              </div>
              <div>
                <span>Status</span>
                <p>{user.status || 'Active'}</p>
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
