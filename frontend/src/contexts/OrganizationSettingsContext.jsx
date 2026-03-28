import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create the context
const OrganizationSettingsContext = createContext();

// Custom hook for easy access
export const useOrganizationSettings = () => {
  const context = useContext(OrganizationSettingsContext);
  if (!context) {
    throw new Error('useOrganizationSettings must be used within OrganizationSettingsProvider');
  }
  return context;
};

// Load initial data from localStorage
const loadInitialData = () => {
  if (typeof window === 'undefined') {
    return {
      display: { darkMode: false, highContrast: false, compactView: false, primaryColor: '#1f7de2', accentColor: '#059669' },
      privacy: { publicProfile: true, showDonations: false, showSupporters: true, allowContact: false },
      notifications: { emailNotifications: true, monthlyReports: false, campaignUpdates: true, donationAlerts: true, systemNotifications: true },
      autoApproveDonations: true,
      twoFactorEnabled: false,
      organization: { name: '', email: '', phone: '', description: '', address: '', website: '' }
    };
  }
  
  try {
    const savedPrefs = window.localStorage.getItem('chomnuoy_org_settings');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      return {
        display: { darkMode: false, highContrast: false, compactView: false, primaryColor: '#1f7de2', accentColor: '#059669', ...prefs.display },
        privacy: { publicProfile: true, showDonations: false, showSupporters: true, allowContact: false, ...prefs.privacy },
        notifications: { emailNotifications: true, monthlyReports: false, campaignUpdates: true, donationAlerts: true, systemNotifications: true, ...prefs.notifications },
        autoApproveDonations: prefs.autoApproveDonations !== false,
        twoFactorEnabled: prefs.twoFactorEnabled || false,
        organization: prefs.organization || { name: '', email: '', phone: '', description: '', address: '', website: '' }
      };
    }
  } catch (error) {
    console.error('Failed to load organization settings:', error);
  }
  
  return {
    display: { darkMode: false, highContrast: false, compactView: false, primaryColor: '#1f7de2', accentColor: '#059669' },
    privacy: { publicProfile: true, showDonations: false, showSupporters: true, allowContact: false },
    notifications: { emailNotifications: true, monthlyReports: false, campaignUpdates: true, donationAlerts: true, systemNotifications: true },
    autoApproveDonations: true,
    twoFactorEnabled: false,
    organization: { name: '', email: '', phone: '', description: '', address: '', website: '' }
  };
};

const initialData = loadInitialData();

function buildOrganizationProfile(orgInfo, currentProfile = {}) {
  return {
    ...currentProfile,
    name: orgInfo.name || currentProfile.name || '',
    email: orgInfo.email || currentProfile.email || '',
    phone: orgInfo.phone || currentProfile.phone || '',
    website: orgInfo.website || currentProfile.website || '',
    about: orgInfo.description || currentProfile.about || '',
    description: orgInfo.description || currentProfile.description || '',
    location: orgInfo.address || currentProfile.location || currentProfile.address || '',
    address: orgInfo.address || currentProfile.address || currentProfile.location || '',
  };
}

function syncOrganizationStorage(orgInfo, settingsData) {
  const existingProfileRaw = window.localStorage.getItem('chomnuoy_org_profile');
  const existingProfile = existingProfileRaw ? JSON.parse(existingProfileRaw) : {};
  const nextProfile = buildOrganizationProfile(orgInfo, existingProfile);

  window.localStorage.setItem('chomnuoy_org_settings', JSON.stringify(settingsData));
  window.localStorage.setItem('chomnuoy_org_info', JSON.stringify(orgInfo));
  window.localStorage.setItem('chomnuoy_org_profile', JSON.stringify(nextProfile));

  const rawSession = window.localStorage.getItem('chomnuoy_session');
  const session = rawSession ? JSON.parse(rawSession) : null;
  if (session) {
    const nextSession = {
      ...session,
      name: nextProfile.name || session.name,
      email: nextProfile.email || session.email,
    };
    window.localStorage.setItem('chomnuoy_session', JSON.stringify(nextSession));
  }

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('chomnuoy-org-profile-updated'));
}

// Provider component
export const OrganizationSettingsProvider = ({ children }) => {
  // Organization Information State
  const [orgInfo, setOrgInfo] = useState(initialData.organization);
  const [orgInfoLoading, setOrgInfoLoading] = useState(false);
  const [orgInfoSaved, setOrgInfoSaved] = useState(false);

  // Display Preferences State
  const [displayPrefs, setDisplayPrefs] = useState(initialData.display);

  // Privacy Settings State
  const [privacySettings, setPrivacySettings] = useState(initialData.privacy);

  // Security State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialData.twoFactorEnabled);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState(initialData.notifications);
  const [autoApproveDonations, setAutoApproveDonations] = useState(initialData.autoApproveDonations);

  // Billing State
  const [billingInfo, setBillingInfo] = useState({
    plan: 'free',
    planPrice: '$0/month',
    nextBillingDate: null,
    paymentMethod: null,
    cardBrand: '',
    cardLast4: '',
    cardExpiry: ''
  });
  const [billingLoading, setBillingLoading] = useState(false);

  // General UI State
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Load initial data from localStorage (only on client side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadOrganizationData();
      loadSettings();
      loadBillingInfo();
    }
  }, []);

  // Apply display preferences globally
  useEffect(() => {
    // Apply dark mode
    if (displayPrefs.darkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // Apply high contrast
    if (displayPrefs.highContrast) {
      document.body.classList.add('high-contrast');
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.body.classList.remove('high-contrast');
      document.documentElement.setAttribute('data-contrast', 'normal');
    }
    
    // Apply compact view
    if (displayPrefs.compactView) {
      document.body.classList.add('compact-view');
      document.documentElement.setAttribute('data-layout', 'compact');
    } else {
      document.body.classList.remove('compact-view');
      document.documentElement.setAttribute('data-layout', 'normal');
    }
    
    // Apply custom colors
    document.documentElement.style.setProperty('--primary-color', displayPrefs.primaryColor);
    document.documentElement.style.setProperty('--accent-color', displayPrefs.accentColor);
  }, [displayPrefs]);

  // Load organization data
  const loadOrganizationData = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      const session = JSON.parse(window.localStorage.getItem('chomnuoy_session') || '{}');
      if (!session.userId) return;

      // Load from localStorage
      const savedOrg = window.localStorage.getItem('chomnuoy_org_info');
      if (savedOrg) {
        setOrgInfo(JSON.parse(savedOrg));
      }
    } catch (error) {
      console.error('Failed to load organization data:', error);
    }
  };

  const loadSettings = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Load saved preferences from localStorage
      const savedPrefs = window.localStorage.getItem('chomnuoy_org_settings');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setDisplayPrefs(prev => ({ ...prev, ...prefs.display }));
        setPrivacySettings(prev => ({ ...prev, ...prefs.privacy }));
        setNotificationSettings(prev => ({ ...prev, ...prefs.notifications }));
        setAutoApproveDonations(prefs.autoApproveDonations !== false);
        setTwoFactorEnabled(prefs.twoFactorEnabled || false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadBillingInfo = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Load from localStorage
      const savedBilling = window.localStorage.getItem('chomnuoy_org_billing');
      if (savedBilling) {
        setBillingInfo(JSON.parse(savedBilling));
      }
    } catch (error) {
      console.error('Failed to load billing info:', error);
    }
  };

  // Save all settings globally
  const saveSettings = async () => {
    setIsSaving(true);
    setSavedMessage('');
    setErrors({});

    try {
      const settingsData = {
        display: displayPrefs,
        privacy: privacySettings,
        notifications: notificationSettings,
        autoApproveDonations,
        twoFactorEnabled,
        organization: orgInfo
      };

      syncOrganizationStorage(orgInfo, settingsData);
      
      setSavedMessage('Settings applied globally to all organization pages!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      setErrors({ general: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Update individual settings
  const updateDisplayPrefs = useCallback((newPrefs) => {
    setDisplayPrefs(prev => ({ ...prev, ...newPrefs }));
  }, []);

  const updatePrivacySettings = useCallback((newSettings) => {
    setPrivacySettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateNotificationSettings = useCallback((newSettings) => {
    setNotificationSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateOrgInfo = useCallback((newInfo) => {
    setOrgInfo(prev => ({ ...prev, ...newInfo }));
  }, []);

  // Save current settings to localStorage
  const persistSettings = useCallback(() => {
    const settingsData = {
      display: displayPrefs,
      privacy: privacySettings,
      notifications: notificationSettings,
      autoApproveDonations,
      twoFactorEnabled,
      organization: orgInfo
    };

    syncOrganizationStorage(orgInfo, settingsData);
  }, [displayPrefs, privacySettings, notificationSettings, autoApproveDonations, twoFactorEnabled, orgInfo]);

  const value = {
    // State
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
    setIsSaving,
    savedMessage,
    setSavedMessage,
    errors,
    setErrors,
    
    // Actions
    saveSettings,
    updateDisplayPrefs,
    updatePrivacySettings,
    updateNotificationSettings,
    updateOrgInfo,
    persistSettings,
    loadOrganizationData,
    loadSettings,
    loadBillingInfo
  };

  return (
    <OrganizationSettingsContext.Provider value={value}>
      {children}
    </OrganizationSettingsContext.Provider>
  );
};
