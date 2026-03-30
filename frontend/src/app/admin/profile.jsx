import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from './adminsidebar';
import './style.css';
import './admin-profile-new.css';
import {
  fetchAdminProfile,
  updateAdminPassword,
  updateAdminProfile,
} from '@/services/admin-profile-service.js';
import {
  MapPin,
  Mail,
  Globe,
  Edit3,
  Award,
  Users,
  Star,
  FileText,
  User,
  Shield,
  Bell,
  CheckCircle,
  Upload,
  Briefcase,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Phone,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStorageFileUrl(path) {
  if (!path) return '';
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const normalizedPath = String(path).replace(/\\/g, '/').replace(/^\/+/, '');
  return normalizedPath.startsWith('files/')
    ? `${apiBase}/${normalizedPath}`
    : `${apiBase}/files/${normalizedPath}`;
}

function getReadableError(err) {
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    return `Cannot connect to backend API at ${apiBase}. Please make sure Laravel is running.`;
  }

  const fieldErrors = err?.response?.data?.errors || {};
  return (
    fieldErrors.name?.[0] ||
    fieldErrors.email?.[0] ||
    fieldErrors.avatar?.[0] ||
    fieldErrors.current_password?.[0] ||
    fieldErrors.new_password?.[0] ||
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong.'
  );
}

const iconMap = {
  upload: Upload,
  review: MessageSquare,
  certification: Award,
  project: Briefcase,
  update: FileText,
  achievement: TrendingUp,
};

export default function AdminProfilePage() {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [selectedAvatarName, setSelectedAvatarName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const session = getSession();
  const adminId = session?.userId;
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    bio: '',
    location: '',
    website: '',
    linkedin_url: '',
    skills: [],
    twoFactorEnabled: false,
    avatar: null,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Mock activities data
  const [activities] = useState([
    {
      id: 1,
      type: 'update',
      title: 'Profile Updated',
      description: 'Updated admin profile information and avatar.',
      icon: 'update',
      time_ago: '2 hours ago',
    },
    {
      id: 2,
      type: 'certification',
      title: 'Security Certification',
      description: 'Completed annual security compliance training.',
      icon: 'certification',
      time_ago: 'Yesterday',
    },
    {
      id: 3,
      type: 'achievement',
      title: '100 Campaigns Managed',
      description: 'Successfully managed 100+ donation campaigns.',
      icon: 'achievement',
      time_ago: '3 days ago',
    },
  ]);

  useEffect(() => {
    if (!adminId) {
      setLoading(false);
      setLoadError('Admin session not found. Please log in again.');
      return undefined;
    }

    let active = true;

    async function loadProfile() {
      setLoading(true);
      setLoadError('');
      try {
        const data = await fetchAdminProfile(adminId);
        if (!active) return;
        setProfile(data);
        setForm({
          name: data?.basic_information?.name || '',
          email: data?.basic_information?.email || '',
          phone: data?.basic_information?.phone || '',
          title: data?.basic_information?.title || 'System Administrator',
          bio: data?.basic_information?.bio || '',
          location: data?.basic_information?.location || 'Phnom Penh, Cambodia',
          website: data?.basic_information?.website || '',
          linkedin_url: data?.basic_information?.linkedin_url || '',
          skills: data?.basic_information?.skills || ['Admin Management', 'User Management', 'Security', 'Analytics'],
          twoFactorEnabled: Boolean(data?.account_settings?.two_factor_enabled),
          avatar: null,
        });
        setAvatarPreview(
          data?.basic_information?.profile_picture ||
            getStorageFileUrl(data?.basic_information?.avatar_path || ''),
        );
        setSelectedAvatarName('');
      } catch (err) {
        if (!active) return;
        setLoadError(getReadableError(err));
        // Use mock data for development
        setForm({
          name: adminName,
          email: 'chomnuoy168@gmail.com',
          phone: '068234568',
          title: 'System Administrator',
          bio: 'Experienced system administrator managing the Chomnuoy donation platform. Responsible for overseeing user management, organization verification, and platform security.',
          location: 'Phnom Penh, Cambodia',
          website: '',
          linkedin_url: '',
          skills: ['Admin Management', 'User Management', 'Security', 'Analytics', 'Organization Verification'],
          twoFactorEnabled: false,
          avatar: null,
        });
        setAvatarPreview('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [adminId, adminName]);

  useEffect(() => () => {
    if (avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
  }, [avatarPreview]);

  const initials = useMemo(() => {
    const name = form.name || adminName;
    return name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [adminName, form.name]);

  const syncSession = (nextBasicInfo) => {
    const currentSession = getSession() || {};
    const avatar =
      nextBasicInfo?.profile_picture ||
      getStorageFileUrl(nextBasicInfo?.avatar_path || '') ||
      currentSession.avatar ||
      '';

    window.localStorage.setItem(
      'chomnuoy_session',
      JSON.stringify({
        ...currentSession,
        name: nextBasicInfo?.name || currentSession.name,
        email: nextBasicInfo?.email || currentSession.email,
        avatar,
      }),
    );
    window.dispatchEvent(new Event('chomnuoy-session-updated'));
  };

  const handleProfileChange = (field) => (event) => {
    const value = field === 'twoFactorEnabled' ? event.target.checked : event.target.value;
    setSaveMessage('');
    setSaveError('');
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSkillsChange = (skillsString) => {
    const skills = skillsString.split(',').map((s) => s.trim()).filter(Boolean);
    setForm((previous) => ({ ...previous, skills }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] || null;
    const previousPreview = avatarPreview;
    setForm((previous) => ({ ...previous, avatar: file }));
    setSaveMessage('');
    setSaveError('');
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      setSelectedAvatarName(file.name);
      if (previousPreview.startsWith('blob:')) {
        URL.revokeObjectURL(previousPreview);
      }
    } else {
      setSelectedAvatarName('');
    }
    event.target.value = '';
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!adminId) return;
    setSavingProfile(true);
    setSaveMessage('');
    setSaveError('');
    try {
      const data = await updateAdminProfile(adminId, form);
      setProfile(data);
      setForm((previous) => ({ ...previous, avatar: null }));
      const nextBasicInfo = data?.basic_information || {};
      setAvatarPreview(
        nextBasicInfo.profile_picture || getStorageFileUrl(nextBasicInfo.avatar_path || ''),
      );
      setSelectedAvatarName('');
      syncSession(nextBasicInfo);
      setSaveMessage('Profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      setSaveError(getReadableError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordError('');
    setPasswordMessage('');
    setPasswordForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!adminId) return;
    setSavingPassword(true);
    setPasswordError('');
    setPasswordMessage('');
    try {
      const response = await updateAdminPassword(adminId, passwordForm);
      setPasswordMessage(response?.message || 'Password updated successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordVisibility({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });
    } catch (err) {
      setPasswordError(getReadableError(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError('');
    setSaveMessage('');
  };

  return (
    <div className="admin-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main admin-profile-new">
        <header className="admin-header">
          <div>
            <p className="admin-header-kicker">Admin Profile</p>
            <h1>Profile & Security</h1>
          </div>
        </header>

        {loadError && !profile ? (
          <div className="admin-profile-empty is-error">{loadError}</div>
        ) : (
          <div className="admin-profile-container">
            {/* Main Content */}
            <div className="admin-profile-main">
              {/* Profile Header Card */}
              <div className="profile-header-card">
                <div className="profile-header-content">
                  <div className="profile-avatar-section">
                    <div className="profile-avatar-large">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt={form.name} />
                      ) : (
                        <span>{initials}</span>
                      )}
                      {isEditing && (
                        <label className="avatar-edit-overlay">
                          <Upload size={20} />
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleAvatarChange}
                            hidden
                          />
                        </label>
                      )}
                    </div>
                    <button
                      className="edit-profile-btn"
                      onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
                    >
                      {isEditing ? 'Cancel' : (
                        <>
                          <Edit3 size={16} />
                          Edit Profile
                        </>
                      )}
                    </button>
                  </div>

                  <div className="profile-info-section">
                    {isEditing ? (
                      <div className="edit-form">
                        <input
                          type="text"
                          value={form.name}
                          onChange={handleProfileChange('name')}
                          placeholder="Full Name"
                          className="edit-input name-input"
                        />
                        <input
                          type="text"
                          value={form.title}
                          onChange={handleProfileChange('title')}
                          placeholder="Professional Title"
                          className="edit-input title-input"
                        />
                        <div className="edit-row">
                          <div className="edit-field">
                            <MapPin size={16} />
                            <input
                              type="text"
                              value={form.location}
                              onChange={handleProfileChange('location')}
                              placeholder="Location"
                            />
                          </div>
                          <div className="edit-field">
                            <Mail size={16} />
                            <input
                              type="email"
                              value={form.email}
                              onChange={handleProfileChange('email')}
                              placeholder="Email"
                            />
                          </div>
                        </div>
                        <div className="edit-row">
                          <div className="edit-field">
                            <Phone size={16} />
                            <input
                              type="text"
                              value={form.phone}
                              onChange={handleProfileChange('phone')}
                              placeholder="Phone"
                            />
                          </div>
                          <div className="edit-field">
                            <Globe size={16} />
                            <input
                              type="text"
                              value={form.website}
                              onChange={handleProfileChange('website')}
                              placeholder="Website"
                            />
                          </div>
                        </div>
                        {selectedAvatarName && (
                          <p className="file-selected">Selected: {selectedAvatarName}</p>
                        )}
                        {saveError && <p className="form-error">{saveError}</p>}
                        {saveMessage && <p className="form-success">{saveMessage}</p>}
                        <div className="edit-actions">
                          <button className="save-btn" onClick={handleProfileSubmit} disabled={savingProfile}>
                            <CheckCircle size={16} />
                            {savingProfile ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button className="cancel-btn" onClick={handleCancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h1 className="profile-name">{form.name || adminName}</h1>
                        <p className="profile-title">{form.title || 'System Administrator'}</p>

                        <div className="profile-meta">
                          {form.location && (
                            <span className="meta-item">
                              <MapPin size={16} />
                              {form.location}
                            </span>
                          )}
                          {form.email && (
                            <span className="meta-item">
                              <Mail size={16} />
                              {form.email}
                            </span>
                          )}
                          {form.phone && (
                            <span className="meta-item">
                              <Phone size={16} />
                              {form.phone}
                            </span>
                          )}
                        </div>

                        <div className="profile-badges">
                          <span className="badge">{adminRole}</span>
                          <span className="badge badge-secondary">
                            Last seen {formatDateTime(profile?.basic_information?.last_seen_at)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="profile-tabs">
                <button
                  className={activeTab === 'overview' ? 'active' : ''}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={activeTab === 'security' ? 'active' : ''}
                  onClick={() => setActiveTab('security')}
                >
                  Security
                </button>
                <button
                  className={activeTab === 'activity' ? 'active' : ''}
                  onClick={() => setActiveTab('activity')}
                >
                  Activity
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <>
                  {/* Professional Background */}
                  <div className="profile-section">
                    <h2 className="section-title">Professional Background</h2>
                    {isEditing ? (
                      <textarea
                        value={form.bio}
                        onChange={handleProfileChange('bio')}
                        placeholder="Write a brief bio..."
                        className="edit-textarea"
                        rows={4}
                      />
                    ) : (
                      <p className="profile-bio">
                        {form.bio || 'No bio added yet. Click Edit Profile to add your professional background.'}
                      </p>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div className="profile-section">
                    <h2 className="section-title">Recent Activity</h2>
                    <div className="activity-list">
                      {activities.map((activity) => {
                        const IconComponent = iconMap[activity.icon] || FileText;
                        return (
                          <div key={activity.id} className="activity-item">
                            <div className="activity-icon">
                              <IconComponent size={20} />
                            </div>
                            <div className="activity-content">
                              <h4 className="activity-title">{activity.title}</h4>
                              <p className="activity-description">{activity.description}</p>
                            </div>
                            <span className="activity-time">{activity.time_ago}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'security' && (
                <div className="profile-section">
                  <h2 className="section-title">Change Password</h2>
                  <form className="password-form" onSubmit={handlePasswordSubmit}>
                    <div className="form-row">
                      <label>
                        <span>Current Password</span>
                        <div className="password-field">
                          <Lock size={16} className="field-icon" />
                          <input
                            type={passwordVisibility.currentPassword ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange('currentPassword')}
                            placeholder="Enter current password"
                            required
                          />
                          <button
                            type="button"
                            className="toggle-password"
                            onClick={() => togglePasswordVisibility('currentPassword')}
                          >
                            {passwordVisibility.currentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </label>
                    </div>

                    <div className="form-row">
                      <label>
                        <span>New Password</span>
                        <div className="password-field">
                          <Lock size={16} className="field-icon" />
                          <input
                            type={passwordVisibility.newPassword ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange('newPassword')}
                            placeholder="Enter new password"
                            required
                          />
                          <button
                            type="button"
                            className="toggle-password"
                            onClick={() => togglePasswordVisibility('newPassword')}
                          >
                            {passwordVisibility.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </label>
                    </div>

                    <div className="form-row">
                      <label>
                        <span>Confirm Password</span>
                        <div className="password-field">
                          <Lock size={16} className="field-icon" />
                          <input
                            type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordChange('confirmPassword')}
                            placeholder="Confirm new password"
                            required
                          />
                          <button
                            type="button"
                            className="toggle-password"
                            onClick={() => togglePasswordVisibility('confirmPassword')}
                          >
                            {passwordVisibility.confirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </label>
                    </div>

                    {passwordError && <p className="form-error">{passwordError}</p>}
                    {passwordMessage && <p className="form-success">{passwordMessage}</p>}

                    <button type="submit" className="save-btn" disabled={savingPassword}>
                      <CheckCircle size={16} />
                      {savingPassword ? 'Updating...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="profile-section">
                  <h2 className="section-title">All Activity</h2>
                  <div className="activity-list">
                    {activities.map((activity) => {
                      const IconComponent = iconMap[activity.icon] || FileText;
                      return (
                        <div key={activity.id} className="activity-item">
                          <div className="activity-icon">
                            <IconComponent size={20} />
                          </div>
                          <div className="activity-content">
                            <h4 className="activity-title">{activity.title}</h4>
                            <p className="activity-description">{activity.description}</p>
                          </div>
                          <span className="activity-time">{activity.time_ago}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="admin-profile-sidebar">
              {/* Network Strength Card */}
              <div className="sidebar-card network-card">
                <h3 className="sidebar-card-title">Network Strength</h3>
                <div className="network-rank">{profile?.network_stats?.rank || 'Top 10%'}</div>
                <div className="network-stats">
                  <div className="stat-item">
                    <span className="stat-value">{profile?.network_stats?.connections_count || 0}+</span>
                    <span className="stat-label">Connections</span>
                  </div>
                  <div className="stat-divider" />
                  <div className="stat-item">
                    <span className="stat-value">{profile?.network_stats?.project_reviews_count || 0}</span>
                    <span className="stat-label">Project Reviews</span>
                  </div>
                </div>
              </div>

              {/* Quick Settings */}
              <div className="sidebar-card settings-card">
                <h3 className="sidebar-card-title">Quick Settings</h3>
                <nav className="settings-nav">
                  <button
                    className={`settings-link ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <User size={18} />
                    <span>Personal Info</span>
                    <ArrowRight size={16} className="arrow" />
                  </button>
                  <button
                    className={`settings-link ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                  >
                    <Shield size={18} />
                    <span>Security</span>
                    <ArrowRight size={16} className="arrow" />
                  </button>
                  <button
                    className={`settings-link ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activity')}
                  >
                    <Bell size={18} />
                    <span>Activity</span>
                    <ArrowRight size={16} className="arrow" />
                  </button>
                </nav>
              </div>

              {/* Featured Stats */}
              <div className="sidebar-card stats-card">
                <h3 className="sidebar-card-title">Platform Stats</h3>
                <div className="platform-stats">
                  <div className="platform-stat">
                    <span className="platform-stat-value">{profile?.platform_stats?.users_managed?.toLocaleString() || 0}+</span>
                    <span className="platform-stat-label">Users Managed</span>
                  </div>
                  <div className="platform-stat">
                    <span className="platform-stat-value">{profile?.platform_stats?.organizations_count || 0}+</span>
                    <span className="platform-stat-label">Organizations</span>
                  </div>
                  <div className="platform-stat">
                    <span className="platform-stat-value">${((profile?.platform_stats?.total_donations || 0) / 1000000).toFixed(1)}M</span>
                    <span className="platform-stat-label">Donations Processed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {isLogoutOpen && (
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
      )}
    </div>
  );
}
