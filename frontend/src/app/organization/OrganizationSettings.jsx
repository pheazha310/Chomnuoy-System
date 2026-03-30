import React, { useState } from 'react';
import { User, Eye, EyeOff, Bell, CreditCard, HelpCircle, Shield, Check, X, RefreshCw, Save } from 'lucide-react';
import { useOrganizationSettings } from '@/contexts/OrganizationSettingsContext';
import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';

const Toggle = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    } ${
      checked ? 'bg-blue-600' : 'bg-slate-200'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export default function OrganizationSettings() {
  // Use global context instead of local state
  const {
    orgInfo,
    setOrgInfo,
    orgInfoLoading,
    setOrgInfoLoading,
    orgInfoSaved,
    setOrgInfoSaved,
    displayPrefs,
    setDisplayPrefs,
    privacySettings,
    setPrivacySettings,
    passwordForm,
    setPasswordForm,
    passwordError,
    setPasswordError,
    passwordSuccess,
    setPasswordSuccess,
    isUpdatingPassword,
    setIsUpdatingPassword,
    passwordVisibility,
    setPasswordVisibility,
    twoFactorEnabled,
    setTwoFactorEnabled,
    twoFactorLoading,
    setTwoFactorLoading,
    notificationSettings,
    setNotificationSettings,
    autoApproveDonations,
    setAutoApproveDonations,
    billingInfo,
    setBillingInfo,
    billingLoading,
    setBillingLoading,
    isSaving,
    savedMessage,
    errors,
    saveSettings,
    updateDisplayPrefs,
    updatePrivacySettings,
    updateNotificationSettings,
    updateOrgInfo,
    persistSettings
  } = useOrganizationSettings();

  // Local state for this component only
  const [activeSection, setActiveSection] = useState('general');

  const updateOrganizationInfo = async (field, value) => {
    updateOrgInfo({ [field]: value });
    setOrgInfoSaved(false);
  };

  const saveOrganizationInfo = async () => {
    setOrgInfoLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrgInfoSaved(true);
      setTimeout(() => setOrgInfoSaved(false), 3000);
      // Persist to context
      persistSettings();
    } catch (error) {
      setErrors({ orgInfo: 'Failed to update organization information.' });
    } finally {
      setOrgInfoLoading(false);
    }
  };

  const handlePasswordInput = (field) => (event) => {
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmNewPassword = passwordForm.confirmNewPassword.trim();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPasswordSuccess('Password updated successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      // Persist to context
      persistSettings();
    } catch (error) {
      setPasswordError('Failed to update password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const toggleTwoFactor = async () => {
    setTwoFactorLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTwoFactorEnabled(!twoFactorEnabled);
      // Persist to context
      persistSettings();
    } catch (error) {
      setErrors({ twoFactor: 'Failed to update two-factor authentication.' });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const updatePlan = async (newPlan) => {
    setBillingLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const plans = {
        free: { price: '$0/month', features: ['Basic features', '5 campaigns', 'Email support'] },
        pro: { price: '$29/month', features: ['Unlimited campaigns', 'Advanced analytics', 'Priority support', 'Custom branding'] },
        enterprise: { price: '$99/month', features: ['Everything in Pro', 'API access', 'Dedicated support', 'White labeling'] }
      };
      
      setBillingInfo(prev => ({
        ...prev,
        plan: newPlan,
        planPrice: plans[newPlan].price
      }));
      
      setSavedMessage(`Successfully upgraded to ${newPlan} plan!`);
      setTimeout(() => setSavedMessage(''), 3000);
      // Persist to context
      persistSettings();
    } catch (error) {
      setErrors({ billing: 'Failed to update plan. Please try again.' });
    } finally {
      setBillingLoading(false);
    }
  };

  const menuItems = [
    { id: 'general', label: 'General', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <div className="org-page">
      <OrganizationSidebar />
      <main className="org-main">
        <div className="org-settings">
          <div className="org-settings-header">
            <h1 className="org-settings-title">Settings</h1>
            <button 
              className="org-settings-save-btn"
              onClick={saveSettings}
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

          {savedMessage && (
            <div className="org-settings-success">
              <Check size={16} />
              {savedMessage}
            </div>
          )}

          {errors.general && (
            <div className="org-settings-error">
              <X size={16} />
              {errors.general}
            </div>
          )}

          <div className="org-settings-layout">
            {/* Settings Navigation Bar */}
            <div className="org-settings-nav-bar">
              <nav className="org-settings-nav-tabs">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className={`org-settings-nav-tab ${activeSection === item.id ? 'active' : ''}`}
                      onClick={() => setActiveSection(item.id)}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="org-settings-content">
              {activeSection === 'general' && (
                <div className="org-settings-section">
                  <h2 className="org-settings-section-title">General Settings</h2>
                  
                  <div className="org-settings-card">
                    <div className="org-settings-card-header">
                      <h3 className="org-settings-card-title">Organization Information</h3>
                      <button 
                        className="org-settings-card-save-btn"
                        onClick={saveOrganizationInfo}
                        disabled={orgInfoLoading}
                      >
                        {orgInfoLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                    {orgInfoSaved && (
                      <div className="org-settings-card-success">
                        <Check size={14} />
                        Organization information saved!
                      </div>
                    )}
                    {errors.orgInfo && (
                      <div className="org-settings-card-error">
                        <X size={14} />
                        {errors.orgInfo}
                      </div>
                    )}
                    <div className="org-settings-form">
                      <div className="org-settings-form-group">
                        <label className="org-settings-label">Organization Name</label>
                        <input
                          type="text"
                          className="org-settings-input"
                          value={orgInfo.name}
                          onChange={(e) => updateOrganizationInfo('name', e.target.value)}
                          placeholder="Enter organization name"
                        />
                      </div>
                      <div className="org-settings-form-group">
                        <label className="org-settings-label">Email</label>
                        <input
                          type="email"
                          className="org-settings-input"
                          value={orgInfo.email}
                          onChange={(e) => updateOrganizationInfo('email', e.target.value)}
                          placeholder="contact@organization.org"
                        />
                      </div>
                      <div className="org-settings-form-group">
                        <label className="org-settings-label">Phone</label>
                        <input
                          type="tel"
                          className="org-settings-input"
                          value={orgInfo.phone}
                          onChange={(e) => updateOrganizationInfo('phone', e.target.value)}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      <div className="org-settings-form-group">
                        <label className="org-settings-label">Website</label>
                        <input
                          type="url"
                          className="org-settings-input"
                          value={orgInfo.website}
                          onChange={(e) => updateOrganizationInfo('website', e.target.value)}
                          placeholder="https://your-website.org"
                        />
                      </div>
                      <div className="org-settings-form-group">
                        <label className="org-settings-label">Description</label>
                        <textarea
                          className="org-settings-textarea"
                          value={orgInfo.description}
                          onChange={(e) => updateOrganizationInfo('description', e.target.value)}
                          placeholder="Tell us about your organization..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="org-settings-card">
                    <h3 className="org-settings-card-title">Display Preferences</h3>
                    <div className="org-settings-toggles">
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">Dark Mode</p>
                          <p className="org-settings-toggle-desc">Adjust the interface to a dark theme.</p>
                        </div>
                        <Toggle 
                          checked={displayPrefs.darkMode} 
                          onChange={() => setDisplayPrefs(prev => ({ ...prev, darkMode: !prev.darkMode }))} 
                        />
                      </div>
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">High Contrast Mode</p>
                          <p className="org-settings-toggle-desc">Increase contrast for better accessibility.</p>
                        </div>
                        <Toggle 
                          checked={displayPrefs.highContrast} 
                          onChange={() => setDisplayPrefs(prev => ({ ...prev, highContrast: !prev.highContrast }))} 
                        />
                      </div>
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">Compact View</p>
                          <p className="org-settings-toggle-desc">Show more content in less space.</p>
                        </div>
                        <Toggle 
                          checked={displayPrefs.compactView} 
                          onChange={() => setDisplayPrefs(prev => ({ ...prev, compactView: !prev.compactView }))} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="org-settings-card">
                    <h3 className="org-settings-card-title">Privacy Settings</h3>
                    <div className="org-settings-toggles">
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">Make profile public</p>
                          <p className="org-settings-toggle-desc">Allow donors to find and view your organization profile.</p>
                        </div>
                        <Toggle 
                          checked={privacySettings.publicProfile} 
                          onChange={() => setPrivacySettings(prev => ({ ...prev, publicProfile: !prev.publicProfile }))} 
                        />
                      </div>
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">Show donation amounts</p>
                          <p className="org-settings-toggle-desc">Display specific donation amounts publicly.</p>
                        </div>
                        <Toggle 
                          checked={privacySettings.showDonations} 
                          onChange={() => setPrivacySettings(prev => ({ ...prev, showDonations: !prev.showDonations }))} 
                        />
                      </div>
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">Show supporters</p>
                          <p className="org-settings-toggle-desc">Display names of supporters publicly.</p>
                        </div>
                        <Toggle 
                          checked={privacySettings.showSupporters} 
                          onChange={() => setPrivacySettings(prev => ({ ...prev, showSupporters: !prev.showSupporters }))} 
                        />
                      </div>
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">Allow contact</p>
                          <p className="org-settings-toggle-desc">Allow donors to contact your organization.</p>
                        </div>
                        <Toggle 
                          checked={privacySettings.allowContact} 
                          onChange={() => setPrivacySettings(prev => ({ ...prev, allowContact: !prev.allowContact }))} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="org-settings-section">
                  <h2 className="org-settings-section-title">Security Settings</h2>
                  
                  <div className="org-settings-card">
                    <h3 className="org-settings-card-title">Change Password</h3>
                    <form className="org-settings-form" onSubmit={handleUpdatePassword}>
                      <div className="org-settings-form-group">
                        <label className="org-settings-label">Current Password</label>
                        <div className="org-settings-input-group">
                          <input
                            className="org-settings-input"
                            placeholder="Enter current password"
                            type={passwordVisibility.currentPassword ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordInput('currentPassword')}
                          />
                          <button
                            type="button"
                            className="org-settings-password-toggle"
                            onClick={() => togglePasswordVisibility('currentPassword')}
                          >
                            {passwordVisibility.currentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="org-settings-form-group">
                        <label className="org-settings-label">New Password</label>
                        <div className="org-settings-input-group">
                          <input
                            className="org-settings-input"
                            placeholder="Enter new password"
                            type={passwordVisibility.newPassword ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={handlePasswordInput('newPassword')}
                          />
                          <button
                            type="button"
                            className="org-settings-password-toggle"
                            onClick={() => togglePasswordVisibility('newPassword')}
                          >
                            {passwordVisibility.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="org-settings-form-group">
                        <label className="org-settings-label">Confirm New Password</label>
                        <div className="org-settings-input-group">
                          <input
                            className="org-settings-input"
                            placeholder="Confirm new password"
                            type={passwordVisibility.confirmNewPassword ? 'text' : 'password'}
                            value={passwordForm.confirmNewPassword}
                            onChange={handlePasswordInput('confirmNewPassword')}
                          />
                          <button
                            type="button"
                            className="org-settings-password-toggle"
                            onClick={() => togglePasswordVisibility('confirmNewPassword')}
                          >
                            {passwordVisibility.confirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      {passwordError && <div className="org-settings-error">{passwordError}</div>}
                      {passwordSuccess && <div className="org-settings-success">{passwordSuccess}</div>}
                      <button
                        type="submit"
                        className="org-settings-submit-btn"
                        disabled={isUpdatingPassword}
                      >
                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>

                  <div className="org-settings-card">
                    <div className="org-settings-card-header">
                      <h3 className="org-settings-card-title">Two-Factor Authentication</h3>
                      <div className="org-settings-2fa-status">
                        {twoFactorEnabled ? (
                          <span className="org-settings-2fa-enabled">
                            <Check size={14} />
                            Enabled
                          </span>
                        ) : (
                          <span className="org-settings-2fa-disabled">
                            <X size={14} />
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>
                    {errors.twoFactor && (
                      <div className="org-settings-card-error">
                        <X size={14} />
                        {errors.twoFactor}
                      </div>
                    )}
                    <div className="org-settings-toggles">
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">Enable 2FA</p>
                          <p className="org-settings-toggle-desc">Add an extra layer of security to your account.</p>
                        </div>
                        <Toggle 
                          checked={twoFactorEnabled} 
                          onChange={toggleTwoFactor}
                          disabled={twoFactorLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="org-settings-section">
                  <h2 className="org-settings-section-title">Notification Settings</h2>
                  
                  <div className="org-settings-card">
                    <h3 className="org-settings-card-title">Email Notifications</h3>
                    <div className="org-settings-toggles">
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">New Donations</p>
                          <p className="org-settings-toggle-desc">Receive email alerts for new donations.</p>
                        </div>
                        <Toggle 
                          checked={notificationSettings.emailNotifications} 
                          onChange={() => setNotificationSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))} 
                        />
                      </div>
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">Monthly Reports</p>
                          <p className="org-settings-toggle-desc">Receive monthly impact and donation reports.</p>
                        </div>
                        <Toggle 
                          checked={notificationSettings.monthlyReports} 
                          onChange={() => setNotificationSettings(prev => ({ ...prev, monthlyReports: !prev.monthlyReports }))} 
                        />
                      </div>
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">Campaign Updates</p>
                          <p className="org-settings-toggle-desc">Get notified about campaign performance.</p>
                        </div>
                        <Toggle 
                          checked={notificationSettings.campaignUpdates} 
                          onChange={() => setNotificationSettings(prev => ({ ...prev, campaignUpdates: !prev.campaignUpdates }))} 
                        />
                      </div>
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">Donation Alerts</p>
                          <p className="org-settings-toggle-desc">Instant notifications for new donations.</p>
                        </div>
                        <Toggle 
                          checked={notificationSettings.donationAlerts} 
                          onChange={() => setNotificationSettings(prev => ({ ...prev, donationAlerts: !prev.donationAlerts }))} 
                        />
                      </div>
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">System Notifications</p>
                          <p className="org-settings-toggle-desc">Important system updates and maintenance notices.</p>
                        </div>
                        <Toggle 
                          checked={notificationSettings.systemNotifications} 
                          onChange={() => setNotificationSettings(prev => ({ ...prev, systemNotifications: !prev.systemNotifications }))} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="org-settings-card">
                    <h3 className="org-settings-card-title">Organization Preferences</h3>
                    <div className="org-settings-toggles">
                      <div className="org-settings-toggle-item">
                        <div>
                          <p className="org-settings-toggle-label">Auto-approve donations</p>
                          <p className="org-settings-toggle-desc">Automatically approve donations without manual review.</p>
                        </div>
                        <Toggle 
                          checked={autoApproveDonations} 
                          onChange={() => setAutoApproveDonations(!autoApproveDonations)} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'billing' && (
                <div className="org-settings-section">
                  <h2 className="org-settings-section-title">Billing Settings</h2>
                  
                  <div className="org-settings-card">
                    <div className="org-settings-card-header">
                      <h3 className="org-settings-card-title">Current Plan</h3>
                      {billingLoading && <RefreshCw size={16} className="animate-spin" />}
                    </div>
                    {errors.billing && (
                      <div className="org-settings-card-error">
                        <X size={14} />
                        {errors.billing}
                      </div>
                    )}
                    <div className="org-plan-info">
                      <div className="org-plan-header">
                        <div className="org-plan-name">{billingInfo.plan.charAt(0).toUpperCase() + billingInfo.plan.slice(1)} Plan</div>
                        <div className="org-plan-price">{billingInfo.planPrice}</div>
                        {billingInfo.nextBillingDate && (
                          <div className="org-plan-next-billing">
                            Next billing: {new Date(billingInfo.nextBillingDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="org-plan-features">
                        <ul>
                          {billingInfo.plan === 'free' && [
                            'Basic features',
                            '5 campaigns',
                            'Email support'
                          ].map((feature, i) => <li key={i}>{feature}</li>)}
                          {billingInfo.plan === 'pro' && [
                            'Unlimited campaigns',
                            'Advanced analytics',
                            'Priority support',
                            'Custom branding'
                          ].map((feature, i) => <li key={i}>{feature}</li>)}
                          {billingInfo.plan === 'enterprise' && [
                            'Everything in Pro',
                            'API access',
                            'Dedicated support',
                            'White labeling'
                          ].map((feature, i) => <li key={i}>{feature}</li>)}
                        </ul>
                      </div>
                      <div className="org-plan-actions">
                        {billingInfo.plan !== 'enterprise' && (
                          <button 
                            className="org-upgrade-btn"
                            onClick={() => updatePlan(billingInfo.plan === 'free' ? 'pro' : 'enterprise')}
                            disabled={billingLoading}
                          >
                            {billingLoading ? 'Processing...' : `Upgrade to ${billingInfo.plan === 'free' ? 'Pro' : 'Enterprise'}`}
                          </button>
                        )}
                        {billingInfo.plan !== 'free' && (
                          <button 
                            className="org-downgrade-btn"
                            onClick={() => updatePlan(billingInfo.plan === 'enterprise' ? 'pro' : 'free')}
                            disabled={billingLoading}
                          >
                            Downgrade
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="org-settings-card">
                    <h3 className="org-settings-card-title">Payment Method</h3>
                    <div className="org-payment-method">
                      {billingInfo.paymentMethod === 'card' ? (
                        <div className="org-payment-card">
                          <div className="org-payment-brand">{billingInfo.cardBrand}</div>
                          <div className="org-payment-number">•••• {billingInfo.cardLast4}</div>
                          <div className="org-payment-expiry">Expires {billingInfo.cardExpiry}</div>
                        </div>
                      ) : (
                        <div className="org-payment-empty">
                          <p>No payment method on file</p>
                        </div>
                      )}
                      <button className="org-update-payment-btn">
                        {billingInfo.paymentMethod === 'card' ? 'Update Payment Method' : 'Add Payment Method'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'help' && (
                <div className="org-settings-section">
                  <h2 className="org-settings-section-title">Help & Support</h2>
                  
                  <div className="org-settings-card">
                    <h3 className="org-settings-card-title">Resources</h3>
                    <div className="org-help-links">
                      <a href="#" className="org-help-link" onClick={(e) => { e.preventDefault(); alert('Opening documentation...'); }}>
                        Documentation
                      </a>
                      <a href="#" className="org-help-link" onClick={(e) => { e.preventDefault(); alert('Opening tutorial videos...'); }}>
                        Tutorial Videos
                      </a>
                      <a href="#" className="org-help-link" onClick={(e) => { e.preventDefault(); alert('Opening FAQ...'); }}>
                        FAQ
                      </a>
                      <a href="#" className="org-help-link" onClick={(e) => { e.preventDefault(); alert('Opening community forum...'); }}>
                        Community Forum
                      </a>
                    </div>
                  </div>

                  <div className="org-settings-card">
                    <h3 className="org-settings-card-title">Contact Support</h3>
                    <div className="org-support-info">
                      <p>Need help? Our support team is here for you.</p>
                      <div className="org-support-buttons">
                        <button 
                          className="org-support-btn primary"
                          onClick={() => alert('Starting live chat...')}
                        >
                          Start Live Chat
                        </button>
                        <button 
                          className="org-support-btn secondary"
                          onClick={() => window.location.href = 'mailto:support@chomnuoy.org'}
                        >
                          Email Support
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
