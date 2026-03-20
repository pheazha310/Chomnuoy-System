import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from './language.jsx';

const EN_TO_KM = {
  'Dashboard': 'ផ្ទាំងគ្រប់គ្រង',
  'Users': 'អ្នកប្រើប្រាស់',
  'Organizations': 'អង្គការ',
  'Material Pickups': 'ទទួលសម្ភារៈ',
  'Reports': 'របាយការណ៍',
  'Donations': 'ការបរិច្ចាគ',
  'Transactions': 'ប្រតិបត្តិការ',
  'Notifications': 'ការជូនដំណឹង',
  'Settings': 'ការកំណត់',
  'Logout': 'ចាកចេញ',
  'Overview': 'ទិដ្ឋភាពទូទៅ',
  'Admin Dashboard Hub': 'មជ្ឈមណ្ឌលផ្ទាំងគ្រប់គ្រង',
  'Urgent Tasks': 'ភារកិច្ចបន្ទាន់',
  'View All Tasks': 'មើលភារកិច្ចទាំងអស់',
  'Recent Organizations Onboarding': 'អង្គការថ្មីៗដែលបានចូលប្រើ',
  'Platform Settings': 'ការកំណត់ប្រព័ន្ធ',
  'Profile Settings': 'ការកំណត់ប្រវត្តិរូប',
  'Full Name': 'ឈ្មោះពេញ',
  'Email Address': 'អ៊ីមែល',
  'Platform Configuration': 'ការកំណត់វេទិកា',
  'Application Name': 'ឈ្មោះកម្មវិធី',
  'Default Language': 'ភាសាលំនាំដើម',
  'Default Currency': 'រូបិយប័ណ្ណលំនាំដើម',
  'Security': 'សុវត្ថិភាព',
  'Two-Factor Authentication': 'ការផ្ទៀងផ្ទាត់ពីរជាន់',
  'Add an extra layer of security to your account.': 'បន្ថែមស្រទាប់សុវត្ថិភាពបន្ថែមសម្រាប់គណនី។',
  'Enable 2FA': 'បើក 2FA',
  'Password Management': 'គ្រប់គ្រងពាក្យសម្ងាត់',
  'Current Password': 'ពាក្យសម្ងាត់បច្ចុប្បន្ន',
  'New Password': 'ពាក្យសម្ងាត់ថ្មី',
  'Update Password': 'ប្តូរពាក្យសម្ងាត់',
  'Session Security': 'សុវត្ថិភាពសម័យ',
  'Automatic Logout': 'ចាកចេញស្វ័យប្រវត្តិ',
  'Login Notifications': 'ជូនដំណឹងពេលចូល',
  'Notify me of new login attempts': 'ជូនដំណឹងពេលមានការព្យាយាមចូលថ្មី',
  'Integration & API': 'ការតភ្ជាប់ & API',
  'Merchant ID': 'លេខសម្គាល់ពាណិជ្ជករ',
  'API Key (Production)': 'API Key (ផលិតកម្ម)',
  'Webhook Endpoints': 'Webhook Endpoints',
  'Configure where platform events are sent.': 'កំណត់ទីតាំងទទួលព្រឹត្តិការណ៍ពីប្រព័ន្ធ។',
  'Manage Hooks': 'គ្រប់គ្រង Hooks',
  'Save Changes': 'រក្សាទុក',
  'Saving...': 'កំពុងរក្សាទុក...',
  'Organization Management': 'ការគ្រប់គ្រងអង្គការ',
  'All Organizations': 'អង្គការទាំងអស់',
  'Pending': 'កំពុងរង់ចាំ',
  'Verified': 'បានផ្ទៀងផ្ទាត់',
  'Search organizations...': 'ស្វែងរកអង្គការ...',
  'User Management': 'ការគ្រប់គ្រងអ្នកប្រើប្រាស់',
  'All Users': 'អ្នកប្រើប្រាស់ទាំងអស់',
  'Active': 'សកម្ម',
  'Inactive': 'អសកម្ម',
  'Search users...': 'ស្វែងរកអ្នកប្រើប្រាស់...',
  'Reports & Insights': 'របាយការណ៍ និងការយល់ដឹង',
  'Admin Reports Center': 'មជ្ឈមណ្ឌលរបាយការណ៍អ្នកគ្រប់គ្រង',
  'Download CSV': 'ទាញយក CSV',
  'Export PDF': 'នាំចេញ PDF',
  'Last 7 Days': '7 ថ្ងៃចុងក្រោយ',
  'Last 30 Days': '30 ថ្ងៃចុងក្រោយ',
  'Last 90 Days': '90 ថ្ងៃចុងក្រោយ',
  'Donation Volume': 'បរិមាណបរិច្ចាគ',
  'Items Picked Up': 'ចំនួនសម្ភារៈដែលទទួល',
  'Active Campaigns': 'យុទ្ធនាការសកម្ម',
  'Avg. Resolution Time': 'ពេលវេលាដោះស្រាយមធ្យម',
  'Notifications': 'ការជូនដំណឹង',
  'No notifications found': 'មិនមានការជូនដំណឹង',
  'Mark all as read': 'សម្គាល់ទាំងអស់ថាបានអាន',
  'See older notifications': 'មើលការជូនដំណឹងចាស់ៗ',
  'User & Organization Joins': 'អ្នកប្រើប្រាស់ និងអង្គការដែលបានចូលថ្មី',
  'Loading organizations...': 'កំពុងផ្ទុកអង្គការ...',
  'No organizations found.': 'មិនមានអង្គការ។',
  'Are you sure you want to logout?': 'តើអ្នកពិតជាចង់ចាកចេញមែនទេ?',
  'You will be returned to the login page.': 'អ្នកនឹងត្រូវបានបញ្ជូនទៅទំព័រចូល។',
  'Cancel': 'បោះបង់',
  'Primary': 'ចម្បង',
  'Mentions': 'ការរំលឹក',
  'Activity': 'សកម្មភាព',
  'All Notifications': 'ការជូនដំណឹងទាំងអស់',
  'Unread': 'មិនទាន់អាន',
  'Critical Alerts': 'ការជូនដំណឹងបន្ទាន់',
  'System Updates': 'ការអាប់ដេតប្រព័ន្ធ',
  'Archive': 'បណ្ណសារ',
  'Stay updated with your broadcasts': 'ទទួលព័ត៌មានថ្មីៗជានិច្ច',
  'Channel Health': 'សុខភាពឆានែល',
  'Live Viewers': 'អ្នកមើលបន្តផ្ទាល់',
  'Avg. Watch': 'មធ្យមពេលមើល',
  'Drop Rate': 'អត្រាធ្លាក់ចេញ',
  'Engagement': 'ការចូលរួម',
  'High': 'ខ្ពស់',
  'No notifications found': 'មិនមានការជូនដំណឹង',
  'Try switching tabs or filters to see more updates.': 'សូមប្តូរ tab ឬ filter ដើម្បីមើលព័ត៌មានបន្ថែម។',
  'All Users': 'អ្នកប្រើប្រាស់ទាំងអស់',
  'Search users by name, email or role...': 'ស្វែងរកអ្នកប្រើប្រាស់តាមឈ្មោះ អ៊ីមែល ឬតួនាទី...',
  'Recently Joined Users': 'អ្នកប្រើប្រាស់ដែលទើបចូលថ្មី',
  'Name': 'ឈ្មោះ',
  'Role': 'តួនាទី',
  'Status': 'ស្ថានភាព',
  'Joined': 'ថ្ងៃចូល',
  'Actions': 'សកម្មភាព',
  'Edit': 'កែសម្រួល',
  'Delete': 'លុប',
  'Offline': 'អវត្តមាន',
  'Online': 'អនឡាញ',
  'Create User': 'បង្កើតអ្នកប្រើប្រាស់',
  'Total Entities': 'ចំនួនសរុប',
  'NGOs': 'អង្គការ NGO',
  'Schools': 'សាលារៀន',
  'Hospitals': 'មន្ទីរពេទ្យ',
  'Track and verify organizations onboarded into the platform.': 'តាមដាន និងផ្ទៀងផ្ទាត់អង្គការដែលបានចូលប្រើវេទិកា។',
  'Search organizations by name, email or type...': 'ស្វែងរកអង្គការតាមឈ្មោះ អ៊ីមែល ឬប្រភេទ...',
  'Total Organizations': 'ចំនួនអង្គការសរុប',
  'Type': 'ប្រភេទ',
  'Location': 'ទីតាំង',
  'Organization': 'អង្គការ',
  'Reports & Insights': 'របាយការណ៍ និងទិន្នន័យវិភាគ',
  'Track fundraising performance, operational health, and campaign impact.': 'តាមដានលទ្ធផលការរៃអង្គាស សុខភាពប្រតិបត្តិការ និងឥទ្ធិពលយុទ្ធនាការ។',
  'Download CSV': 'ទាញយក CSV',
  'Export PDF': 'នាំចេញ PDF',
  'Report filters': 'តម្រងរបាយការណ៍',
  'Include pending records': 'បញ្ចូលទិន្នន័យកំពុងរង់ចាំ',
  'Include refunds': 'បញ្ចូលការសងប្រាក់វិញ',
  'Auto export weekly summary': 'នាំចេញស្វ័យប្រវត្តិប្រចាំសប្តាហ៍',
  'Top Campaign Performance': 'លទ្ធផលយុទ្ធនាការកំពូល',
  'Campaign': 'យុទ្ធនាការ',
  'Raised': 'ប្រាក់ដែលបានប្រមូល',
  'Goal': 'គោលដៅ',
  'Growth': 'កំណើន',
  'On Track': 'ដំណើរការល្អ',
  'At Risk': 'មានហានិភ័យ',
  'Delayed': 'ពន្យាពេល',
  'System Alerts': 'ការជូនដំណឹងប្រព័ន្ធ',
  'Failed to save settings.': 'រក្សាទុកការកំណត់មិនបានទេ។',
  'Settings saved successfully.': 'រក្សាទុកការកំណត់បានជោគជ័យ។',
  'Please provide current and new password.': 'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន និងពាក្យសម្ងាត់ថ្មី។',
  'Password updated successfully.': 'បានប្តូរពាក្យសម្ងាត់ជោគជ័យ។',
};

const KM_TO_EN = Object.fromEntries(
  Object.entries(EN_TO_KM).map(([en, km]) => [km, en])
);

function replaceUsingMap(text, pairs) {
  let output = text;
  pairs.forEach(([from, to]) => {
    if (!from || from === to || !output.includes(from)) {
      return;
    }
    output = output.split(from).join(to);
  });
  return output;
}

function replaceDynamic(text, language) {
  if (!text) return text;
  let output = text;

  if (language === 'km') {
    output = output.replace(/Last\s+(\d+)\s+Days/gi, '$1 ថ្ងៃចុងក្រោយ');
    output = output.replace(/Log out after\s+(\d+)\s+min\s+of inactivity/gi, 'ចាកចេញបន្ទាប់ពីអសកម្ម $1 នាទី');
    output = output.replace(/(\d+)\s+new/gi, '$1 ថ្មី');
    output = output.replace(/(\d+)\s+unread notifications/gi, '$1 ការជូនដំណឹងមិនទាន់អាន');
  } else {
    output = output.replace(/(\d+)\s+ថ្ងៃចុងក្រោយ/gi, 'Last $1 Days');
    output = output.replace(/ចាកចេញបន្ទាប់ពីអសកម្ម\s+(\d+)\s+នាទី/gi, 'Log out after $1 min of inactivity');
    output = output.replace(/(\d+)\s+ថ្មី/gi, '$1 new');
    output = output.replace(/(\d+)\s+ការជូនដំណឹងមិនទាន់អាន/gi, '$1 unread notifications');
  }

  return output;
}

function translateNodeText(node, pairs, language) {
  if (!node || node.nodeType !== Node.TEXT_NODE) {
    return;
  }
  const current = node.nodeValue || '';
  const next = replaceDynamic(replaceUsingMap(current, pairs), language);
  if (next !== current) {
    node.nodeValue = next;
  }
}

function translateAttributes(element, pairs, language) {
  ['placeholder', 'title', 'aria-label'].forEach((attribute) => {
    const current = element.getAttribute(attribute);
    if (!current) return;
    const next = replaceDynamic(replaceUsingMap(current, pairs), language);
    if (next !== current) {
      element.setAttribute(attribute, next);
    }
  });
}

function walkAndTranslate(root, pairs, language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }
  textNodes.forEach((node) => translateNodeText(node, pairs, language));

  root.querySelectorAll('*').forEach((element) => translateAttributes(element, pairs, language));
}

export function useAdminAutoTranslate() {
  const { language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      return undefined;
    }

    const pairs = Object.entries(language === 'km' ? EN_TO_KM : KM_TO_EN)
      .sort((a, b) => b[0].length - a[0].length);

    const apply = () => {
      document.querySelectorAll('.admin-shell').forEach((root) => {
        walkAndTranslate(root, pairs, language);
      });
    };

    apply();
    const rafId = window.requestAnimationFrame(apply);
    const timeoutId = window.setTimeout(apply, 100);

    const observer = new MutationObserver(() => apply());
    document.querySelectorAll('.admin-shell').forEach((root) => {
      observer.observe(root, { childList: true, subtree: true, characterData: true });
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [language, location.pathname]);
}
