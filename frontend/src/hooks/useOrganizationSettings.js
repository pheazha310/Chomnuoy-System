import { useOrganizationSettings } from '@/contexts/OrganizationSettingsContext';

// Individual hooks for specific settings to make it easier for components
export const useDisplayPreferences = () => {
  const { displayPrefs, updateDisplayPrefs } = useOrganizationSettings();
  return { displayPrefs, updateDisplayPrefs };
};

export const usePrivacySettings = () => {
  const { privacySettings, updatePrivacySettings } = useOrganizationSettings();
  return { privacySettings, updatePrivacySettings };
};

export const useNotificationSettings = () => {
  const { notificationSettings, updateNotificationSettings } = useOrganizationSettings();
  return { notificationSettings, updateNotificationSettings };
};

export const useOrganizationInfo = () => {
  const { orgInfo, updateOrgInfo } = useOrganizationSettings();
  return { orgInfo, updateOrgInfo };
};

export const useBillingInfo = () => {
  const { billingInfo, setBillingInfo } = useOrganizationSettings();
  return { billingInfo, setBillingInfo };
};

// Hook for applying theme globally
export const useGlobalTheme = () => {
  const { displayPrefs, updateDisplayPrefs } = useOrganizationSettings();
  
  const toggleDarkMode = () => {
    updateDisplayPrefs({ darkMode: !displayPrefs.darkMode });
  };
  
  const toggleHighContrast = () => {
    updateDisplayPrefs({ highContrast: !displayPrefs.highContrast });
  };
  
  const toggleCompactView = () => {
    updateDisplayPrefs({ compactView: !displayPrefs.compactView });
  };
  
  const setPrimaryColor = (color) => {
    updateDisplayPrefs({ primaryColor: color });
  };
  
  const setAccentColor = (color) => {
    updateDisplayPrefs({ accentColor: color });
  };
  
  return {
    displayPrefs,
    toggleDarkMode,
    toggleHighContrast,
    toggleCompactView,
    setPrimaryColor,
    setAccentColor
  };
};

// Hook for privacy management
export const useGlobalPrivacy = () => {
  const { privacySettings, updatePrivacySettings } = useOrganizationSettings();
  
  const togglePublicProfile = () => {
    updatePrivacySettings({ publicProfile: !privacySettings.publicProfile });
  };
  
  const toggleShowDonations = () => {
    updatePrivacySettings({ showDonations: !privacySettings.showDonations });
  };
  
  const toggleShowSupporters = () => {
    updatePrivacySettings({ showSupporters: !privacySettings.showSupporters });
  };
  
  const toggleAllowContact = () => {
    updatePrivacySettings({ allowContact: !privacySettings.allowContact });
  };
  
  return {
    privacySettings,
    togglePublicProfile,
    toggleShowDonations,
    toggleShowSupporters,
    toggleAllowContact
  };
};

// Hook for notification management
export const useGlobalNotifications = () => {
  const { notificationSettings, updateNotificationSettings } = useOrganizationSettings();
  
  const toggleEmailNotifications = () => {
    updateNotificationSettings({ emailNotifications: !notificationSettings.emailNotifications });
  };
  
  const toggleMonthlyReports = () => {
    updateNotificationSettings({ monthlyReports: !notificationSettings.monthlyReports });
  };
  
  const toggleCampaignUpdates = () => {
    updateNotificationSettings({ campaignUpdates: !notificationSettings.campaignUpdates });
  };
  
  const toggleDonationAlerts = () => {
    updateNotificationSettings({ donationAlerts: !notificationSettings.donationAlerts });
  };
  
  const toggleSystemNotifications = () => {
    updateNotificationSettings({ systemNotifications: !notificationSettings.systemNotifications });
  };
  
  return {
    notificationSettings,
    toggleEmailNotifications,
    toggleMonthlyReports,
    toggleCampaignUpdates,
    toggleDonationAlerts,
    toggleSystemNotifications
  };
};
