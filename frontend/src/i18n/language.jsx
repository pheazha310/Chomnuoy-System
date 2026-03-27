import React, { createContext, useContext, useMemo, useState } from 'react';

const LANGUAGE_STORAGE_KEY = 'chomnuoy_app_language';

const MESSAGES = {
  en: {
    'admin.nav.dashboard': 'Dashboard',
    'admin.nav.users': 'Users',
    'admin.nav.organizations': 'Organizations',
    'admin.nav.materialPickups': 'Material Pickups',
    'admin.nav.reports': 'Reports',
    'admin.nav.donations': 'Donations',
    'admin.nav.transactions': 'Transactions',
    'admin.nav.notifications': 'Notifications',
    'admin.nav.profile': 'Profile Admin',
    'admin.nav.settings': 'Settings',
    'admin.nav.logout': 'Logout',
    'admin.settings.title': 'Platform Settings',
    'admin.settings.subtitle': 'Manage your platform identity, security defaults, and system integrations.',
    'admin.settings.save': 'Save Changes',
    'admin.settings.profile': 'Profile Settings',
    'admin.settings.fullName': 'Full Name',
    'admin.settings.email': 'Email Address',
    'admin.settings.platform': 'Platform Configuration',
    'admin.settings.appName': 'Application Name',
    'admin.settings.defaultLanguage': 'Default Language',
    'admin.settings.defaultCurrency': 'Default Currency',
    'admin.settings.security': 'Security',
    'admin.settings.twoFa': 'Two-Factor Authentication',
    'admin.settings.twoFaSub': 'Add an extra layer of security to your account.',
    'admin.settings.enable2fa': 'Enable 2FA',
    'admin.settings.passwordManagement': 'Password Management',
    'admin.settings.currentPassword': 'Current Password',
    'admin.settings.newPassword': 'New Password',
    'admin.settings.updatePassword': 'Update Password',
    'admin.settings.sessionSecurity': 'Session Security',
    'admin.settings.autoLogout': 'Automatic Logout',
    'admin.settings.autoLogoutSub': 'Log out after {minutes} min of inactivity',
    'admin.settings.loginNotifications': 'Login Notifications',
    'admin.settings.loginNotificationsSub': 'Notify me of new login attempts',
    'admin.settings.integration': 'Integration & API',
    'admin.settings.merchantId': 'Merchant ID',
    'admin.settings.apiKey': 'API Key (Production)',
    'admin.settings.webhook': 'Webhook Endpoints',
    'admin.settings.webhookSub': 'Configure where platform events are sent.',
    'admin.settings.manageHooks': 'Manage Hooks',
    'admin.settings.addWebhook': 'Add Webhook',
    'admin.settings.webhookPlaceholder': 'https://example.com/webhook',
    'admin.settings.noWebhook': 'No webhook endpoints added yet.',
    'common.remove': 'Remove',
    'common.add': 'Add',
    'admin.settings.currentPasswordPlaceholder': 'Enter current password',
    'admin.settings.newPasswordPlaceholder': 'Enter new password',
    'lang.en': 'English (US)',
    'lang.km': 'Khmer (KH)',
    'currency.usd': 'USD - US Dollar',
    'currency.khr': 'KHR - Khmer Riel',
  },
  km: {
    'admin.nav.profile': 'Profile Admin',
    'admin.nav.dashboard': 'ផ្ទាំងគ្រប់គ្រង',
    'admin.nav.users': 'អ្នកប្រើប្រាស់',
    'admin.nav.organizations': 'អង្គការ',
    'admin.nav.materialPickups': 'ទទួលសម្ភារៈ',
    'admin.nav.reports': 'របាយការណ៍',
    'admin.nav.donations': 'ការបរិច្ចាគ',
    'admin.nav.transactions': 'ប្រតិបត្តិការ',
    'admin.nav.notifications': 'ការជូនដំណឹង',
    'admin.nav.settings': 'ការកំណត់',
    'admin.nav.logout': 'ចាកចេញ',
    'admin.settings.title': 'ការកំណត់ប្រព័ន្ធ',
    'admin.settings.subtitle': 'គ្រប់គ្រងអត្តសញ្ញាណប្រព័ន្ធ សុវត្ថិភាព និងការតភ្ជាប់ផ្សេងៗ។',
    'admin.settings.save': 'រក្សាទុក',
    'admin.settings.profile': 'ការកំណត់ប្រវត្តិរូប',
    'admin.settings.fullName': 'ឈ្មោះពេញ',
    'admin.settings.email': 'អ៊ីមែល',
    'admin.settings.platform': 'ការកំណត់វេទិកា',
    'admin.settings.appName': 'ឈ្មោះកម្មវិធី',
    'admin.settings.defaultLanguage': 'ភាសាលំនាំដើម',
    'admin.settings.defaultCurrency': 'រូបិយប័ណ្ណលំនាំដើម',
    'admin.settings.security': 'សុវត្ថិភាព',
    'admin.settings.twoFa': 'ការផ្ទៀងផ្ទាត់ពីរជាន់',
    'admin.settings.twoFaSub': 'បន្ថែមស្រទាប់សុវត្ថិភាពបន្ថែមសម្រាប់គណនី។',
    'admin.settings.enable2fa': 'បើក 2FA',
    'admin.settings.passwordManagement': 'គ្រប់គ្រងពាក្យសម្ងាត់',
    'admin.settings.currentPassword': 'ពាក្យសម្ងាត់បច្ចុប្បន្ន',
    'admin.settings.newPassword': 'ពាក្យសម្ងាត់ថ្មី',
    'admin.settings.updatePassword': 'ប្តូរពាក្យសម្ងាត់',
    'admin.settings.sessionSecurity': 'សុវត្ថិភាពសម័យ',
    'admin.settings.autoLogout': 'ចាកចេញស្វ័យប្រវត្តិ',
    'admin.settings.autoLogoutSub': 'ចាកចេញបន្ទាប់ពីអសកម្ម {minutes} នាទី',
    'admin.settings.loginNotifications': 'ជូនដំណឹងពេលចូល',
    'admin.settings.loginNotificationsSub': 'ជូនដំណឹងពេលមានការព្យាយាមចូលថ្មី',
    'admin.settings.integration': 'ការតភ្ជាប់ & API',
    'admin.settings.merchantId': 'លេខសម្គាល់ពាណិជ្ជករ',
    'admin.settings.apiKey': 'API Key (ផលិតកម្ម)',
    'admin.settings.webhook': 'Webhook Endpoints',
    'admin.settings.webhookSub': 'កំណត់ទីតាំងទទួលព្រឹត្តិការណ៍ពីប្រព័ន្ធ។',
    'admin.settings.manageHooks': 'គ្រប់គ្រង Hooks',
    'admin.settings.addWebhook': 'បន្ថែម Webhook',
    'admin.settings.webhookPlaceholder': 'https://example.com/webhook',
    'admin.settings.noWebhook': 'មិនទាន់មាន webhook endpoint នៅឡើយ។',
    'common.remove': 'លុប',
    'common.add': 'បន្ថែម',
    'admin.settings.currentPasswordPlaceholder': 'បញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន',
    'admin.settings.newPasswordPlaceholder': 'បញ្ចូលពាក្យសម្ងាត់ថ្មី',
    'lang.en': 'អង់គ្លេស (US)',
    'lang.km': 'ខ្មែរ (KH)',
    'currency.usd': 'ដុល្លារ USD',
    'currency.khr': 'រៀល KHR',
  },
};

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

function normalizeLanguage(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'km' || raw === 'kh' || raw.includes('khmer')) {
    return 'km';
  }

  return 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return normalizeLanguage(saved);
  });

  const setLanguage = (value) => {
    const normalized = normalizeLanguage(value);
    setLanguageState(normalized);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    document.documentElement.lang = normalized === 'km' ? 'km' : 'en';
  };

  const value = useMemo(() => {
    const messages = MESSAGES[language] || MESSAGES.en;
    const t = (key, params = {}) => {
      let text = messages[key] || MESSAGES.en[key] || key;
      Object.keys(params).forEach((paramKey) => {
        text = text.replace(`{${paramKey}}`, String(params[paramKey]));
      });
      return text;
    };

    return { language, setLanguage, t };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function normalizeLanguageValue(value) {
  return normalizeLanguage(value);
}
