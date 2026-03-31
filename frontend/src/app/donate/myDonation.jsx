import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  Building2,
  CalendarDays,
  Check,
  Copy,
  Download,
  Filter,
  GraduationCap,
  HandHeart,
  Linkedin,
  Reply,
  Search,
  Send,
  Share2,
  Stethoscope,
  Waves,
} from 'lucide-react';
import { getSession } from '@/services/session-service';
import { getDonationHistoryResources } from '@/services/donation-service';
import './myDonation.css';

const DONATION_CACHE_KEY = 'donor_my_donations_v1';
const DONATION_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const USD_TO_KHR_RATE = 4100;

const SUMMARY_META = [
  {
    title: 'TOTAL LIFETIME GIVING',
    icon: <Banknote className="my-donation-icon-svg" />,
    iconBox: 'my-donation-summary-icon-blue',
    subtitleColor: 'my-donation-summary-subtitle-success',
  },
  {
    title: 'ORGANIZATIONS SUPPORTED',
    icon: <Building2 className="my-donation-icon-svg" />,
    iconBox: 'my-donation-summary-icon-green',
    subtitleColor: 'my-donation-summary-subtitle-muted',
  },
  {
    title: 'IMPACT (LIVES TOUCHED)',
    icon: <HandHeart className="my-donation-icon-svg" />,
    iconBox: 'my-donation-summary-icon-amber',
    subtitleColor: 'my-donation-summary-subtitle-muted',
  },
];

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeStatus = (status) => {
  const value = String(status || '').toUpperCase();
  if (value === 'COMPLETED' || value === 'SUCCESS') {
    return { label: 'COMPLETED', className: 'my-donation-status-completed' };
  }
  if (value === 'RECURRING') {
    return { label: 'RECURRING', className: 'my-donation-status-recurring' };
  }
  return { label: 'PENDING', className: 'my-donation-status-pending' };
};

const isSuccessfulPaymentStatus = (status) => {
  const value = String(status || '').trim().toUpperCase();
  return ['COMPLETED', 'SUCCESS', 'CONFIRMED', 'PAID'].includes(value);
};

const isSuccessfulDonationStatus = (status) => {
  const value = String(status || '').trim().toUpperCase();
  return ['COMPLETED', 'SUCCESS', 'CONFIRMED', 'PAID', 'RECURRING'].includes(value);
};

const normalizeCurrency = (currency) => (String(currency || 'USD').trim().toUpperCase() === 'KHR' ? 'KHR' : 'USD');

const convertToUsdAmount = (amount, currency = 'USD') => {
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount)) return 0;
  return normalizeCurrency(currency) === 'KHR' ? numericAmount / USD_TO_KHR_RATE : numericAmount;
};

const formatMoney = (amount) => `$${Number(amount || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const extractCampaignIdFromBillNumber = (billNumber) => {
  const raw = String(billNumber || '').trim();
  const match = raw.match(/^DON-(\d+)-/i);
  return match ? Number(match[1]) : 0;
};

const findBestMatchingPayment = ({ donation, payments, matchedPaymentIds }) => {
  const donationAmount = Number(donation?.amount || 0);
  const donationUserId = Number(donation?.user_id || 0);
  const donationCampaignId = Number(donation?.campaign_id || 0);
  const donationTime = toDate(donation?.created_at)?.getTime() ?? 0;

  return payments
    .filter((payment) => !matchedPaymentIds.has(Number(payment.id)))
    .filter((payment) => isSuccessfulPaymentStatus(payment.status))
    .filter((payment) => Number(payment.user_id || 0) === donationUserId)
    .filter((payment) => Number(payment.amount || 0) === donationAmount)
    .filter((payment) => {
      const paymentCampaignId = extractCampaignIdFromBillNumber(payment.bill_number);
      return !donationCampaignId || !paymentCampaignId || paymentCampaignId === donationCampaignId;
    })
    .map((payment) => {
      const paymentTime = toDate(payment.paid_at || payment.created_at)?.getTime() ?? 0;
      return {
        payment,
        timeDifference: Math.abs(paymentTime - donationTime),
      };
    })
    .filter(({ timeDifference }) => timeDifference <= 60 * 60 * 1000)
    .sort((a, b) => a.timeDifference - b.timeDifference)[0]?.payment ?? null;
};

const getIconByCategory = (category = '') => {
  const key = String(category).toLowerCase();
  if (key.includes('water') || key.includes('environment')) {
    return { icon: <Waves className="my-donation-cause-icon-svg" />, bg: 'my-donation-cause-icon-blue' };
  }
  if (key.includes('education') || key.includes('school')) {
    return { icon: <GraduationCap className="my-donation-cause-icon-svg" />, bg: 'my-donation-cause-icon-amber' };
  }
  if (key.includes('health') || key.includes('medical')) {
    return { icon: <Stethoscope className="my-donation-cause-icon-svg" />, bg: 'my-donation-cause-icon-green' };
  }
  return { icon: <HandHeart className="my-donation-cause-icon-svg" />, bg: 'my-donation-cause-icon-rose' };
};

const getStorageFileUrl = (path) => {
  if (!path) return '';
  const rawPath = String(path).trim();
  if (
    rawPath.startsWith('http://') ||
    rawPath.startsWith('https://') ||
    rawPath.startsWith('blob:') ||
    rawPath.startsWith('data:')
  ) {
    return rawPath;
  }

  const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const appBase = apiBase.replace(/\/api\/?$/, '');

  if (normalizedPath.startsWith('uploads/') || normalizedPath.startsWith('storage/')) {
    return `${appBase}/${normalizedPath}`;
  }

  return `${appBase}/storage/${normalizedPath}`;
};

const readDonationCache = () => {
  try {
    const raw = window.sessionStorage.getItem(DONATION_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed?.timestamp) return null;
    if (Date.now() - parsed.timestamp > DONATION_CACHE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(DONATION_CACHE_KEY);
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
};

const writeDonationCache = (data) => {
  try {
    window.sessionStorage.setItem(
      DONATION_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore cache write failures.
  }
};

export default function MyDonation() {
  const cachedData = useMemo(() => readDonationCache(), []);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [shareDonation, setShareDonation] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showAllDonations, setShowAllDonations] = useState(false);
  const [donations, setDonations] = useState(Array.isArray(cachedData?.donations) ? cachedData.donations : []);
  const [materialItems, setMaterialItems] = useState(Array.isArray(cachedData?.materialItems) ? cachedData.materialItems : []);
  const [campaigns, setCampaigns] = useState(Array.isArray(cachedData?.campaigns) ? cachedData.campaigns : []);
  const [organizations, setOrganizations] = useState(Array.isArray(cachedData?.organizations) ? cachedData.organizations : []);
  const [payments, setPayments] = useState(Array.isArray(cachedData?.payments) ? cachedData.payments : []);
  const [pickups, setPickups] = useState(Array.isArray(cachedData?.pickups) ? cachedData.pickups : []);
  const [users, setUsers] = useState(Array.isArray(cachedData?.users) ? cachedData.users : []);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState('');
  const formatAmount = (amount) => amount;
  const [isTimePopupOpen, setIsTimePopupOpen] = useState(false);
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [timeFilterLabel, setTimeFilterLabel] = useState('All Time');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [sortOrder, setSortOrder] = useState('Newest');
  const timeFilterRef = useRef(null);
  const mainFilterRef = useRef(null);
  const timeFilterOptions = ['All Time', 'This Month', 'Last Month', 'Last 3 Months', 'This Year'];
  const statusFilterOptions = ['All Status', 'COMPLETED', 'RECURRING', 'PENDING'];
  const sortOptions = ['Newest', 'Oldest'];

  const session = getSession();
  const userId = Number(session?.userId ?? 0);

  useEffect(() => {
    let alive = true;
    setError('');
    setLoading(!cachedData);

    if (!userId) {
      setDonations([]);
      setMaterialItems([]);
      setCampaigns([]);
      setOrganizations([]);
      setPayments([]);
      setPickups([]);
      setUsers([]);
      setLoading(false);
      setError('Please log in to view your donation history.');
      return () => {
        alive = false;
      };
    }

    const nextCache = {
      donations: Array.isArray(cachedData?.donations) ? cachedData.donations : [],
      materialItems: Array.isArray(cachedData?.materialItems) ? cachedData.materialItems : [],
      campaigns: Array.isArray(cachedData?.campaigns) ? cachedData.campaigns : [],
      organizations: Array.isArray(cachedData?.organizations) ? cachedData.organizations : [],
      payments: Array.isArray(cachedData?.payments) ? cachedData.payments : [],
      pickups: Array.isArray(cachedData?.pickups) ? cachedData.pickups : [],
      users: Array.isArray(cachedData?.users) ? cachedData.users : [],
    };

    getDonationHistoryResources()
      .then((data) => {
        if (!alive) return;

        const donationList = data.donations.filter((item) => Number(item.user_id) === userId);
        const donationIds = new Set(donationList.map((item) => Number(item.id)));
        const materialList = data.materialItems.filter((item) => donationIds.has(Number(item.donation_id)));
        const paymentList = data.payments.filter((item) => Number(item.user_id) === userId);

        setDonations(donationList);
        setMaterialItems(materialList);
        setCampaigns(data.campaigns);
        setOrganizations(data.organizations);
        setPayments(paymentList);
        setPickups(data.pickups);
        setUsers(data.users);

        nextCache.donations = donationList;
        nextCache.materialItems = materialList;
        nextCache.campaigns = data.campaigns;
        nextCache.organizations = data.organizations;
        nextCache.payments = paymentList;
        nextCache.pickups = data.pickups;
        nextCache.users = data.users;
        writeDonationCache(nextCache);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load donations.');
      })
      .finally(() => {
        if (alive) {
        setLoading(false);
      }
    });

    return () => {
      alive = false;
    };
  }, [cachedData, userId]);

  const donationItems = useMemo(() => {
    const campaignMap = new Map(campaigns.map((item) => [Number(item.id), item]));
    const organizationMap = new Map(organizations.map((item) => [Number(item.id), item]));
    const paymentMap = new Map();
    const matchedPaymentIds = new Set();

    payments.forEach((item) => {
      const donationId = Number(item.donation_id || 0);
      if (donationId) {
        paymentMap.set(donationId, item);
      }
    });

    const donationRows = donations
      .filter((item) => String(item.donation_type || '').toLowerCase() === 'money')
      .map((item) => {
        const campaign = campaignMap.get(Number(item.campaign_id));
        const organization = organizationMap.get(Number(item.organization_id));
        const payment = paymentMap.get(Number(item.id)) || findBestMatchingPayment({
          donation: item,
          payments,
          matchedPaymentIds,
        });
        if (payment?.id) {
          matchedPaymentIds.add(Number(payment.id));
        }
        const status = normalizeStatus(item.status);
        const category = campaign?.category || item.category || campaign?.type || 'General';
        const iconMeta = getIconByCategory(category);
        const dateValue = toDate(item.created_at);
        const currency = normalizeCurrency(payment?.currency);
        const amountUsd = convertToUsdAmount(item.amount, currency);

        return {
          id: item.id,
          date: dateValue ? dateValue.toLocaleDateString() : '-',
          dateValue: dateValue ? dateValue.getTime() : 0,
          amount: formatMoney(amountUsd),
          amountUsd,
          currency: 'USD',
          recipient:
            campaign?.title ||
            organization?.name ||
            item.recipient ||
            'Organization',
          subCause:
            item.sub_cause ||
            campaign?.title ||
            campaign?.category ||
            item.notes ||
            'General Support',
          status: status.label,
          statusClass: status.className,
          icon: iconMeta.icon,
          iconBg: iconMeta.bg,
          isSuccessful: isSuccessfulDonationStatus(item.status),
          organizationId: Number(item.organization_id || campaign?.organization_id || 0),
          detailState: {
            donationId: item.id,
            amount: amountUsd.toFixed(2),
            currency: 'USD',
            date: dateValue
              ? dateValue.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '-',
            transactionId: payment?.transaction_id ? `#${payment.transaction_id}` : `#DON-${item.id}`,
            paymentMethod: payment?.store_label || payment?.payment_method || item.payment_method || 'Bakong KHQR',
            campaignTitle: campaign?.title || organization?.name || item.recipient || 'Campaign',
            campaignImage:
              getStorageFileUrl(campaign?.image_path) ||
              campaign?.image ||
              organization?.avatar_url ||
              'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
            campaignLocation: campaign?.location || organization?.location || 'Cambodia',
            organizationName: organization?.name || campaign?.organization_name || 'Organization',
            receiptMessage: campaign?.receipt_message || '',
            status: item.status || 'completed',
            isMaterial: false,
          },
        };
      });

    const directPaymentRows = payments
      .filter((payment) => !matchedPaymentIds.has(Number(payment.id)))
      .filter((payment) => isSuccessfulPaymentStatus(payment.status))
      .map((payment) => {
        const campaignId = extractCampaignIdFromBillNumber(payment.bill_number);
        const campaign = campaignMap.get(campaignId);
        const organization = organizationMap.get(Number(campaign?.organization_id || 0));
        const status = normalizeStatus(payment.status);
        const category = campaign?.category || 'General';
        const iconMeta = getIconByCategory(category);
        const dateValue = toDate(payment.paid_at || payment.created_at);
        const amountValue = convertToUsdAmount(payment.amount, payment.currency);

        return {
          id: `payment-${payment.id}`,
          date: dateValue ? dateValue.toLocaleDateString() : '-',
          dateValue: dateValue ? dateValue.getTime() : 0,
          amount: formatMoney(amountValue),
          amountUsd: amountValue,
          currency: 'USD',
          recipient: campaign?.title || organization?.name || 'Organization',
          subCause: campaign?.category || campaign?.title || 'General Support',
          status: status.label,
          statusClass: status.className,
          icon: iconMeta.icon,
          iconBg: iconMeta.bg,
          isSuccessful: true,
          organizationId: Number(campaign?.organization_id || organization?.id || 0),
          detailState: {
            donationId: null,
            amount: amountValue.toFixed(2),
            currency: 'USD',
            date: dateValue
              ? dateValue.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '-',
            transactionId: payment?.transaction_id ? `#${payment.transaction_id}` : `#PAY-${payment.id}`,
            paymentMethod: payment?.store_label || 'Bakong KHQR',
            campaignTitle: campaign?.title || 'Campaign',
            campaignImage:
              getStorageFileUrl(campaign?.image_path) ||
              campaign?.image ||
              'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
            campaignLocation: campaign?.location || organization?.location || 'Cambodia',
            organizationName: organization?.name || 'Organization',
            receiptMessage: campaign?.receipt_message || '',
            status: payment.status || 'success',
            isMaterial: false,
          },
        };
      });

    return [...donationRows, ...directPaymentRows];
  }, [campaigns, donations, organizations, payments]);

  const latestDonationTime = donationItems.reduce((latest, item) => {
    return item.dateValue > latest ? item.dateValue : latest;
  }, 0);
  const referenceDate = new Date(latestDonationTime || Date.now());

  const summaryCards = useMemo(() => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const successfulDonationItems = donationItems.filter((row) => row.isSuccessful);

    const totalFunds = successfulDonationItems.reduce((sum, row) => sum + Number(row.amountUsd || 0), 0);
    const thisMonthFunds = successfulDonationItems
      .filter((row) => {
        const date = toDate(row.dateValue);
        return date && date >= startThisMonth;
      })
      .reduce((sum, row) => sum + Number(row.amountUsd || 0), 0);
    const lastMonthFunds = successfulDonationItems
      .filter((row) => {
        const date = toDate(row.dateValue);
        return date && date >= startLastMonth && date <= endLastMonth;
      })
      .reduce((sum, row) => sum + Number(row.amountUsd || 0), 0);

    const percentChange = (current, previous) => {
      if (!previous) return '0.0% increase from last month';
      const change = ((current - previous) / previous) * 100;
      const label = change >= 0 ? 'increase' : 'decrease';
      return `${Math.abs(change).toFixed(1)}% ${label} from last month`;
    };

    const organizationIds = new Set(successfulDonationItems.map((row) => Number(row.organizationId || 0)).filter(Boolean));
    const uniqueOrganizations = organizationIds.size;
    const impactCount = successfulDonationItems.length;

    return [
      {
        ...SUMMARY_META[0],
        value: formatMoney(totalFunds),
        subtitle: percentChange(thisMonthFunds, lastMonthFunds),
      },
      {
        ...SUMMARY_META[1],
        value: uniqueOrganizations.toLocaleString(),
        subtitle: 'Direct support to local & global entities',
      },
      {
        ...SUMMARY_META[2],
        value: impactCount.toLocaleString(),
        subtitle: 'Across environmental & social sectors',
      },
    ];
  }, [donationItems]);

  const isInTimeRange = useCallback((itemDateValue) => {
    if (timeFilterLabel === 'All Time') return true;

    const date = new Date(itemDateValue);
    if (Number.isNaN(date.getTime())) return false;

    const itemYear = date.getFullYear();
    const itemMonth = date.getMonth();
    const refYear = referenceDate.getFullYear();
    const refMonth = referenceDate.getMonth();

    if (timeFilterLabel === 'This Year') {
      return itemYear === refYear;
    }

    if (timeFilterLabel === 'This Month') {
      return itemYear === refYear && itemMonth === refMonth;
    }

    if (timeFilterLabel === 'Last Month') {
      const lastMonthDate = new Date(refYear, refMonth - 1, 1);
      return itemYear === lastMonthDate.getFullYear() && itemMonth === lastMonthDate.getMonth();
    }

    if (timeFilterLabel === 'Last 3 Months') {
      const start = new Date(refYear, refMonth - 2, 1);
      const end = new Date(refYear, refMonth + 1, 0, 23, 59, 59, 999);
      return date >= start && date <= end;
    }

    return true;
  }, [referenceDate, timeFilterLabel]);

  const filteredDonations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return donationItems
      .filter((item) => isInTimeRange(item.dateValue || item.date))
      .filter((item) => statusFilter === 'All Status' || item.status === statusFilter)
      .filter((item) => {
        if (!query) return true;
        const haystack = [item.recipient, item.subCause, item.amount, item.status]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => {
        if (sortOrder === 'Oldest') return a.dateValue - b.dateValue;
        return b.dateValue - a.dateValue;
      });
  }, [donationItems, isInTimeRange, searchTerm, sortOrder, statusFilter]);

  const visibleDonations = showAllDonations ? filteredDonations : filteredDonations.slice(0, 3);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedTimeFilter = timeFilterRef.current?.contains(event.target);
      const clickedMainFilter = mainFilterRef.current?.contains(event.target);

      if (!clickedTimeFilter) setIsTimePopupOpen(false);
      if (!clickedMainFilter) setIsFilterPopupOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getReceiptNumber = () => `RCP-${Date.now().toString().slice(-8)}`;
  const escapeHtml = (value = '') =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const getReceiptHtml = (donation) => {
    const issuedOn = escapeHtml(new Date().toLocaleString());
    const receiptNumber = escapeHtml(getReceiptNumber());

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Donation Receipt</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 30px;
      background: #f3f6fb;
      color: #0f172a;
      font-family: "Source Sans 3", "Noto Sans Khmer", sans-serif;
    }
    .receipt {
      width: min(430px, 100%);
      margin: 0 auto;
      background: #fff;
      border: 1px dashed #94a3b8;
      border-radius: 10px;
      padding: 22px 18px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
    }
    .center { text-align: center; }
    h1 {
      margin: 0;
      font-size: 20px;
      letter-spacing: 0.06em;
    }
    .muted {
      color: #475569;
      font-size: 13px;
      margin-top: 6px;
    }
    .sep {
      margin: 12px 0;
      border-top: 1px dashed #cbd5e1;
    }
    .line {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      margin: 7px 0;
      font-size: 14px;
    }
    .line strong {
      text-align: right;
      max-width: 62%;
      word-break: break-word;
    }
    .thanks {
      margin-top: 16px;
      text-align: center;
      font-size: 13px;
      color: #334155;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .receipt {
        box-shadow: none;
        border-color: #64748b;
      }
    }
  </style>
</head>
<body>
  <main class="receipt">
    <div class="center">
      <h1>DONATION RECEIPT</h1>
      <div class="muted">Chomnuoy System</div>
    </div>
    <div class="sep"></div>
    <div class="line"><span>Receipt #</span><strong>${receiptNumber}</strong></div>
    <div class="line"><span>Issued On</span><strong>${issuedOn}</strong></div>
    <div class="sep"></div>
    <div class="line"><span>Date</span><strong>${escapeHtml(donation.date)}</strong></div>
    <div class="line"><span>Amount</span><strong>${escapeHtml(formatAmount(donation.amount))}</strong></div>
    <div class="line"><span>Recipient</span><strong>${escapeHtml(donation.recipient)}</strong></div>
    <div class="line"><span>Sub-cause</span><strong>${escapeHtml(donation.subCause)}</strong></div>
    <div class="sep"></div>
    <p class="thanks">Thank you for your contribution.</p>
  </main>
</body>
</html>`;
  };

  const getAllRecordsHtml = () => {
    const issuedOn = escapeHtml(new Date().toLocaleString());
    const totalRecords = filteredDonations.length;

    const rowsHtml = filteredDonations
      .map(
        (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.date)}</td>
        <td>${escapeHtml(formatAmount(item.amount))}</td>
        <td>${escapeHtml(item.recipient)}</td>
        <td>${escapeHtml(item.subCause)}</td>
        <td>${escapeHtml(item.status)}</td>
      </tr>`,
      )
      .join('');

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>All Donation Records</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: #f3f6fb;
      color: #0f172a;
      font-family: "Source Sans 3", "Noto Sans Khmer", sans-serif;
    }
    .sheet {
      max-width: 960px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #dbe3ee;
      border-radius: 12px;
      padding: 18px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
    }
    .meta {
      margin-top: 6px;
      color: #475569;
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #dbe3ee;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #eff6ff;
      font-weight: 700;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .sheet {
        border: 0;
        border-radius: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <main class="sheet">
    <h1>All Donation Records</h1>
    <p class="meta">Generated on: ${issuedOn} | Total records: ${totalRecords}</p>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Recipient</th>
          <th>Sub-cause</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </main>
</body>
</html>`;
  };

  const handleSaveDonationPdf = () => {
    if (!selectedDonation) return;

    const printWindow = window.open('', '_blank', 'width=560,height=760');
    if (!printWindow) return;

    printWindow.document.write(getReceiptHtml(selectedDonation));
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();

    setTimeout(() => {
      printWindow.print();
      handleCloseSavePopup();
    }, 250);
  };

  const handleExportAllRecords = () => {
    const printWindow = window.open('', '_blank', 'width=1100,height=760');
    if (!printWindow) return;

    printWindow.document.write(getAllRecordsHtml());
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleOpenSavePopup = (donation) => {
    setSelectedDonation(donation);
  };

  const handleCloseSavePopup = () => {
    setSelectedDonation(null);
  };

  const handleOpenSharePopup = (donation) => {
    setShareDonation(donation);
    setCopied(false);
  };

  const handleCloseSharePopup = () => {
    setShareDonation(null);
    setCopied(false);
  };

  const getShareText = (donation) =>
    `I donated ${formatAmount(donation.amount)} to ${donation.recipient} (${donation.subCause}).`;

  const getShareUrl = () => {
    const baseUrl = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
    return `${baseUrl}/donations/view-detail`;
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = (platform) => {
    if (!shareDonation) return;

    const encodedUrl = encodeURIComponent(getShareUrl());

    const shareUrl =
      platform === 'telegram'
        ? `https://t.me/share/url?url=${encodedUrl}`
        : `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    handleCloseSharePopup();
  };

  return (
    <div className="my-donation-page">
      <main className="my-donation-container">
        <div className="my-donation-head">
          <div>
            <h1 className="my-donation-title">My Donation</h1>
            <p className="my-donation-subtitle">
              Detailed record of your contributions and the organizations you support.
            </p>
          </div>
          <button type="button" className="my-donation-export-btn" onClick={handleExportAllRecords}>
            <Download className="my-donation-btn-icon" />
            Export All Records
          </button>
        </div>

        <section className="my-donation-summary-grid">
          {summaryCards.map((card) => (
            <article key={card.title} className="my-donation-summary-card">
              <div className="my-donation-summary-top">
                <span className={`my-donation-summary-icon ${card.iconBox}`}>{card.icon}</span>
                <p className="my-donation-summary-title">{card.title}</p>
              </div>
              <p className="my-donation-summary-value">{card.value}</p>
              <p className={`my-donation-summary-subtitle ${card.subtitleColor}`}>{card.subtitle}</p>
            </article>
          ))}
        </section>

        <section className="my-donation-toolbar">
          <label className="my-donation-search-wrap">
            <Search className="my-donation-search-icon" />
            <input
              type="text"
              placeholder="Search by recipient or project..."
              className="my-donation-search-input"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setShowAllDonations(false);
              }}
            />
          </label>
          <div className="my-donation-time-filter-wrap" ref={timeFilterRef}>
            <button
              type="button"
              className="my-donation-filter-time"
              onClick={() => {
                setIsFilterPopupOpen(false);
                setIsTimePopupOpen((prev) => !prev);
              }}
              aria-expanded={isTimePopupOpen}
              aria-haspopup="menu"
            >
              <CalendarDays className="my-donation-small-icon" />
              {timeFilterLabel}
            </button>
            {isTimePopupOpen && (
              <div className="my-donation-time-popup" role="menu">
                {timeFilterOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="menuitem"
                    className={`my-donation-time-option ${timeFilterLabel === option ? 'active' : ''}`}
                    onClick={() => {
                      setTimeFilterLabel(option);
                      setIsTimePopupOpen(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="my-donation-main-filter-wrap" ref={mainFilterRef}>
            <button
              type="button"
              className="my-donation-filter-btn"
              onClick={() => {
                setIsTimePopupOpen(false);
                setIsFilterPopupOpen((prev) => !prev);
              }}
              aria-expanded={isFilterPopupOpen}
              aria-haspopup="menu"
            >
              <Filter className="my-donation-medium-icon" />
            </button>
            {isFilterPopupOpen && (
              <div className="my-donation-main-filter-popup" role="menu">
                <p className="my-donation-main-filter-title">Status</p>
                <div className="my-donation-main-filter-row">
                  {statusFilterOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="menuitem"
                      className={`my-donation-main-filter-chip ${statusFilter === option ? 'active' : ''}`}
                      onClick={() => setStatusFilter(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <p className="my-donation-main-filter-title">Sort By</p>
                <div className="my-donation-main-filter-row">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="menuitem"
                      className={`my-donation-main-filter-chip ${sortOrder === option ? 'active' : ''}`}
                      onClick={() => setSortOrder(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="my-donation-list">
          {error ? (
            <div className="my-donation-row">
              <p className="my-donation-date">{error}</p>
            </div>
          ) : null}
          {!loading && !error && visibleDonations.length === 0 ? (
            <div className="my-donation-row">
              <p className="my-donation-date">No donations match your filters.</p>
            </div>
          ) : null}
          {!loading && !error
            ? visibleDonations.map((item) => (
                <article key={item.id} className="my-donation-row">
                  <div>
                    <p className="my-donation-label">DATE</p>
                    <p className="my-donation-date">{item.date}</p>
                  </div>
                  <div>
                    <p className="my-donation-label">AMOUNT</p>
                    <p className="my-donation-amount">{formatAmount(item.amount)}</p>
                  </div>
                  <div>
                    <p className="my-donation-label">CAUSE & RECIPIENT</p>
                    <div className="my-donation-recipient-wrap">
                      <span className={`my-donation-cause-icon ${item.iconBg}`}>{item.icon}</span>
                      <div>
                        <p className="my-donation-recipient">RECIPIENT: {item.recipient}</p>
                        <p className="my-donation-sub-cause">Sub-cause: {item.subCause}</p>
                      </div>
                    </div>
                  </div>
                  <div className="my-donation-status-wrap">
                    <span className={`my-donation-status ${item.statusClass}`}>{item.status}</span>
                  </div>
                  <button
                    type="button"
                    className="my-donation-icon-btn"
                    aria-label="Save donation"
                    onClick={() => handleOpenSavePopup(item)}
                  >
                    <Download className="my-donation-action-icon" />
                  </button>
                  <div className="my-donation-actions">
                    <button
                      type="button"
                      className="my-donation-icon-btn"
                      aria-label="Share donation"
                      onClick={() => handleOpenSharePopup(item)}
                    >
                      <Share2 className="my-donation-action-icon" strokeWidth={2.7} />
                    </button>
                    <Link
                      to="/donations/view-detail"
                      state={{ donation: item.detailState }}
                      className="my-donation-detail-btn"
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              ))
            : null}
        </section>

        <div className="my-donation-bottom-action">
          <button
            type="button"
            className="my-donation-view-all-btn"
            onClick={() => setShowAllDonations((prev) => !prev)}
          >
            {showAllDonations ? 'View Less' : 'View All'}
          </button>
        </div>
      </main>

      {selectedDonation && (
        <div className="my-donation-modal-overlay" onClick={handleCloseSavePopup}>
          <div
            className="my-donation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-donation-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="save-donation-title">Save Donation Record</h2>
            <p>
              Save this donation to your quick-access list?
            </p>

            <div className="my-donation-modal-details">
              <div>
                <span>Date</span>
                <strong>{selectedDonation.date}</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>{formatAmount(selectedDonation.amount)}</strong>
              </div>
              <div>
                <span>Recipient</span>
                <strong>{selectedDonation.recipient}</strong>
              </div>
            </div>

            <div className="my-donation-modal-actions">
              <button type="button" className="my-donation-modal-btn secondary" onClick={handleCloseSavePopup}>
                Cancel
              </button>
              <button type="button" className="my-donation-modal-btn primary" onClick={handleSaveDonationPdf}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {shareDonation && (
        <div className="my-donation-modal-overlay" onClick={handleCloseSharePopup}>
          <div
            className="my-donation-modal my-donation-share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-donation-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="my-donation-share-head">
              <div className="my-donation-share-link-icon">
                <Reply className="my-donation-action-icon" />
              </div>
              <h2 id="share-donation-title">Share Your Impact</h2>
              <p>Share this contribution with your network.</p>
            </div>

            <div className="my-donation-modal-details my-donation-share-details">
              <div>
                <span>Amount</span>
                <strong>{formatAmount(shareDonation.amount)}</strong>
              </div>
              <div>
                <span>Recipient</span>
                <strong>{shareDonation.recipient}</strong>
              </div>
              <div>
                <span>Project</span>
                <strong>{shareDonation.subCause}</strong>
              </div>
            </div>

            <div className="my-donation-share-link-box">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="my-donation-share-link-input"
                aria-label="Share link"
              />
              <button type="button" className="my-donation-copy-btn" onClick={handleCopyShareLink}>
                {copied ? <Check className="my-donation-btn-icon" /> : <Copy className="my-donation-btn-icon" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <p className="my-donation-share-message">{getShareText(shareDonation)}</p>

            <div className="my-donation-share-actions">
              <button type="button" className="my-donation-share-btn linkedin" onClick={() => handleShare('linkedin')}>
                <Linkedin className="my-donation-btn-icon" />
                Share on LinkedIn
              </button>
              <button type="button" className="my-donation-share-btn telegram" onClick={() => handleShare('telegram')}>
                <Send className="my-donation-btn-icon" />
                Share on Telegram
              </button>
            </div>

            <div className="my-donation-modal-actions">
              <button type="button" className="my-donation-modal-btn secondary" onClick={handleCloseSharePopup}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
