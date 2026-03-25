import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  User, 
  Save, 
  Bell, 
  Shield, 
  Globe, 
  Mail, 
  Lock,
  Eye,
  EyeOff,
  Camera,
  Upload,
  X,
  Check,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import apiClient from '@/services/api-client.js';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import './organization.css';

function OrganizationSettingsPage() {
  const navigate = useNavigate();
  const sessionRef = useRef(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    adminRole: '',
    phoneNumber: '',
  });
  
  const [preferences, setPreferences] = useState({
    language: 'en',
    notifications: true,
    twoFactorAuth: false,
    privacy: {
      profileVisibility: 'public',
      showEmail: true,
      showPhone: false,
    },
    theme: 'light',
  });
  
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load session and organization data
  useEffect(() => {
    const loadSession = () => {
      try {
        const raw = window.localStorage.getItem('chomnuoy_session');
        const parsed = raw ? JSON.parse(raw) : null;
        sessionRef.current = parsed;
        
        if (parsed?.isLoggedIn && parsed?.role === 'Organization') {
          loadOrganizationProfile();
        } else {
          setError('Please login as an organization to access settings');
        }
      } catch (error) {
        console.error('Session loading error:', error);
        setError('Failed to load session data');
      }
    };

    const loadOrganizationProfile = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const userId = sessionRef.current?.userId;
        if (!userId) {
          throw new Error('User ID not found');
        }

        const response = await apiClient.get(`/organizations/${userId}`);
        const organization = response.data;

        if (organization) {
          setProfileForm({
            name: organization.name || '',
            email: organization.email || '',
            adminRole: organization.description || '',
            phoneNumber: organization.location || '',
          });
          
          if (organization.avatar_path) {
            setLogoPreviewUrl(`/storage/${organization.avatar_path}`);
          }

          // Load preferences
          const prefResponse = await apiClient.get(`/organizations/${userId}/preferences`);
          if (prefResponse.data) {
            setPreferences(prev => ({ ...prev, ...prefResponse.data }));
          }
        }
      } catch (error) {
        console.error('Profile loading error:', error);
        setError(error.response?.data?.message || 'Failed to load organization profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const handleProfileChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const userId = sessionRef.current?.userId;
      if (!userId) {
        throw new Error('User ID not found');
      }

      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('email', profileForm.email);
      formData.append('description', profileForm.adminRole);
      formData.append('location', profileForm.phoneNumber);
      
      // Add logo if changed
      if (logoPreviewUrl && logoPreviewUrl.startsWith('data:')) {
        const response = await fetch(logoPreviewUrl);
        const blob = await response.blob();
        formData.append('avatar', blob, 'logo.jpg');
      }

      await apiClient.post(`/organizations/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update session with new data
      const updatedSession = {
        ...sessionRef.current,
        name: profileForm.name,
        email: profileForm.email,
      };
      window.localStorage.setItem('chomnuoy_session', JSON.stringify(updatedSession));

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Profile save error:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const userId = sessionRef.current?.userId;
      if (!userId) {
        throw new Error('User ID not found');
      }

      await apiClient.put(`/organizations/${userId}/preferences`, preferences);
      
      setSuccessMessage('Preferences saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Preferences save error:', error);
      setError(error.response?.data?.message || 'Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const userId = sessionRef.current?.userId;
      if (!userId) {
        throw new Error('User ID not found');
      }

      await apiClient.post(`/organizations/${userId}/change-password`, {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Password change error:', error);
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const userId = sessionRef.current?.userId;
      if (!userId) {
        throw new Error('User ID not found');
      }

      await apiClient.delete(`/organizations/${userId}`);
      
      // Clear session and redirect
      window.localStorage.removeItem('chomnuoy_session');
      navigate('/login');
    } catch (error) {
      console.error('Account deletion error:', error);
      setError(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <div className="org-container">
      <OrganizationSidebar />
      
      <div className="org-content">
        <div className="org-settings">
          <div className="org-settings-header">
            <h1>Organization Settings</h1>
            <p>Manage your organization profile and preferences</p>
          </div>

          {error && (
            <div className="error-message">
              <AlertTriangle size={20} />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              <Check size={20} />
              {successMessage}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="settings-content">
            {activeTab === 'general' && (
              <div className="settings-section">
                <h2>General Settings</h2>
                
                <div className="form-group">
                  <label>Organization Logo</label>
                  <div className="logo-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="logo-upload-label">
                      {logoPreviewUrl ? (
                        <img src={logoPreviewUrl} alt="Logo preview" className="logo-preview" />
                      ) : (
                        <div className="logo-upload-placeholder">
                          <Camera size={24} />
                          <span>Upload Logo</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Organization Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    placeholder="Enter organization name"
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="form-group">
                  <label>Admin Role</label>
                  <input
                    type="text"
                    value={profileForm.adminRole}
                    onChange={(e) => handleProfileChange('adminRole', e.target.value)}
                    placeholder="Enter your role"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn-primary"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-section">
                <h2>Security Settings</h2>
                
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-input">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn-primary"
                    onClick={handlePasswordChange}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Shield size={16} />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2>Notification Preferences</h2>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.notifications}
                      onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                    />
                    <span>Email Notifications</span>
                  </label>
                  <p>Receive email notifications about donations and updates</p>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-primary"
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Bell size={16} />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="settings-section">
                <h2>Privacy Settings</h2>
                
                <div className="form-group">
                  <label>Profile Visibility</label>
                  <select
                    value={preferences.privacy.profileVisibility}
                    onChange={(e) => handlePreferenceChange('privacy', { 
                      ...preferences.privacy, 
                      profileVisibility: e.target.value 
                    })}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.privacy.showEmail}
                      onChange={(e) => handlePreferenceChange('privacy', { 
                        ...preferences.privacy, 
                        showEmail: e.target.checked 
                      })}
                    />
                    <span>Show Email Address</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.privacy.showPhone}
                      onChange={(e) => handlePreferenceChange('privacy', { 
                        ...preferences.privacy, 
                        showPhone: e.target.checked 
                      })}
                    />
                    <span>Show Phone Number</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-primary"
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        Save Privacy Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="settings-section">
                <h2>Account Management</h2>
                
                <div className="form-group">
                  <label>Two-Factor Authentication</label>
                  <div className="toggle-group">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={preferences.twoFactorAuth}
                        onChange={(e) => handlePreferenceChange('twoFactorAuth', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <p>Add an extra layer of security to your account</p>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-primary"
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Shield size={16} />
                        Save Security Settings
                      </>
                    )}
                  </button>
                </div>

                <div className="danger-zone">
                  <h3>Danger Zone</h3>
                  <p>Irreversible and destructive actions</p>
                  <button
                    className="btn-danger"
                    onClick={handleDeleteAccount}
                  >
                    <X size={16} />
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <RefreshCw size={24} className="animate-spin" />
            <span>Loading settings...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganizationSettingsPage;
