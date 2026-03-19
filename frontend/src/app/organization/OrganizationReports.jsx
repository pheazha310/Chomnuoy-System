import { useEffect, useRef, useState } from 'react';
import {
  Download,
  Filter,
  Search,
  Tag,
  Users,
  Wallet,
  Box,
  MapPin,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import './organization.css';
import './organization-reports.css';
import apiClient from '@/services/api-client';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function getOrganizationSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getOrganizationId(session) {
  const candidates = [
    session?.organizationId,
    session?.organization_id,
    session?.orgId,
    session?.userId,
  ];
  const match = candidates.find((value) => Number(value) > 0);
  return match ? Number(match) : 0;
}

function formatDelta(value) {
  const numeric = Number(value) || 0;
  const sign = numeric >= 0 ? '+' : '';
  return `${sign}${numeric.toFixed(1)}%`;
}

function formatCurrency(value) {
  const numeric = Number(value) || 0;
  return `$${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value) {
  const numeric = Number(value) || 0;
  return `${numeric.toFixed(1)}%`;
}

function formatWhole(value) {
  const numeric = Math.round(Number(value) || 0);
  return numeric.toLocaleString();
}

function toneFromPercent(value) {
  const percent = Number(value) || 0;
  if (percent >= 40) return 'high';
  if (percent >= 25) return 'medium';
  if (percent >= 15) return 'low';
  return 'xlow';
}

function statusClassFromLabel(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('delay')) return 'delayed';
  if (normalized.includes('action')) return 'action-needed';
  return 'on-track';
}

function regionalStatusClassFromLabel(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('high')) return 'high';
  if (normalized.includes('medium')) return 'medium';
  return 'low';
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  const escaped = text.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function buildCsvContent(columns, rows) {
  const header = columns.map((col) => escapeCsvValue(col.label)).join(',');
  const body = rows.map((row) => (
    columns.map((col) => {
      const cellValue = typeof col.value === 'function' ? col.value(row) : row[col.value];
      return escapeCsvValue(cellValue);
    }).join(',')
  ));
  return [header, ...body].join('\n');
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function getPageRange(current, last, max = 3) {
  if (last <= max) {
    return Array.from({ length: last }, (_, idx) => idx + 1);
  }
  if (current <= 2) {
    return [1, 2, 3];
  }
  if (current >= last - 1) {
    return [last - 2, last - 1, last];
  }
  return [current - 1, current, current + 1];
}

function calcDeltaPercent(current, previous) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev === 0) {
    return cur > 0 ? 100 : 0;
  }
  return ((cur - prev) / prev) * 100;
}

function buildSummaryFromCache(cache) {
  if (!cache) return null;
  const totalRevenue = Number(cache.total_revenue) || 0;
  const activeDonors = Number(cache.active_donors) || 0;
  const materialUnits = Number(cache.material_units) || 0;
  const avgDonation = Number(cache.avg_donation) || 0;
  const prevTotalRevenue = Number(cache.previous_total_revenue) || 0;
  const prevActiveDonors = Number(cache.previous_active_donors) || 0;
  const prevMaterialUnits = Number(cache.previous_material_units) || 0;
  const prevAvgDonation = Number(cache.previous_avg_donation) || 0;

  return {
    period: {
      start: cache.period_start,
      end: cache.period_end,
    },
    previous_period: {
      start: cache.period_start,
      end: cache.period_end,
    },
    metrics: {
      total_revenue: {
        value: totalRevenue,
        previous: prevTotalRevenue,
        delta_percent: calcDeltaPercent(totalRevenue, prevTotalRevenue),
        positive: totalRevenue >= prevTotalRevenue,
      },
      active_donors: {
        value: activeDonors,
        previous: prevActiveDonors,
        delta_percent: calcDeltaPercent(activeDonors, prevActiveDonors),
        positive: activeDonors >= prevActiveDonors,
      },
      material_units: {
        value: materialUnits,
        previous: prevMaterialUnits,
        delta_percent: calcDeltaPercent(materialUnits, prevMaterialUnits),
        positive: materialUnits >= prevMaterialUnits,
      },
      avg_donation: {
        value: avgDonation,
        previous: prevAvgDonation,
        delta_percent: calcDeltaPercent(avgDonation, prevAvgDonation),
        positive: avgDonation >= prevAvgDonation,
      },
    },
  };
}

// Summary card in overview (fallback)
const fallbackSummaryCards = [
  // { title: 'Total Revenue', value: '$128,450', delta: '+14.2%', positive: true, icon: Wallet },
  // { title: 'Active Donors', value: '4,281', delta: '+5.8%', positive: true, icon: Users },
  // { title: 'Material Units', value: '12,540', delta: '-2.1%', positive: false, icon: Box },
  // { title: 'Avg. Donation', value: '$42.50', delta: '+8.4%', positive: true, icon: Tag },
];

// Donation Trends data in overview and get data from database (Already connect)
const defaultTrendData = [
  // { month: 'Jan', financial: 32, material: 24 },
  // { month: 'Feb', financial: 44, material: 35 },
  // { month: 'Mar', financial: 36, material: 47 },
  // { month: 'Apr', financial: 60, material: 32 },
  // { month: 'May', financial: 52, material: 63 },
  // { month: 'Jun', financial: 72, material: 39 },
  // { month: 'Jul', financial: 90, material: 10 },
  // { month: 'Aug', financial: 87, material: 60 },
  // { month: 'Sep', financial: 67, material: 46 },
  // { month: 'Oct', financial: 94, material: 39 },
  // { month: 'Nov', financial: 82, material: 39 },
  // { month: 'Dec', financial: 79, material: 85 },
];

const fallbackTransactions = [
  // { id: '#TXN-8821', donor: 'Robert Kim', initials: 'RK', type: 'Financial', province: 'Phnom Penh', date: 'Oct 24, 2023', amount: '$250.00' },
  // { id: '#TXN-8819', donor: 'Sophea Lim', initials: 'SL', type: 'Material', province: 'Siem Reap', date: 'Oct 23, 2023', amount: '40 Units' },
  // { id: '#TXN-8815', donor: 'Channy Watt', initials: 'CW', type: 'Financial', province: 'Battambang', date: 'Oct 22, 2023', amount: '$1,200.00' },
];


const fallbackProvinces = [
  // { name: 'Phnom Penh', amount: '$45,200', width: 85 },
  // { name: 'Siem Reap', amount: '$28,150', width: 60 },
  // { name: 'Battambang', amount: '$15,400', width: 35 },
];

const fallbackFinancialSummaryCards = [
  // { title: 'Total Revenue', value: '$128,450', delta: '+14.2%', positive: true },
  // { title: 'Active Donors', value: '4,281', delta: '+5.8%', positive: true },
  // { title: 'Avg. Donation', value: '$42.50', delta: '+8.4%', positive: true },
  // { title: 'Conversion Rate', value: '3.2%', delta: '-1.1%', positive: false },
];

// Revenue vs. Expenses
const defaultRevenueExpenseData = [
  // { month: 'Jan', revenue: 10, expenses: 18 },
  // { month: 'Feb', revenue: 31, expenses: 16 },
  // { month: 'Mar', revenue: 38, expenses: 20 },
  // { month: 'Apr', revenue: 40, expenses: 15 },
  // { month: 'May', revenue: 36, expenses: 19 },
  // { month: 'Jun', revenue: 24, expenses: 22 },
  // { month: 'Jul', revenue: 30, expenses: 25 },
  // { month: 'Aug', revenue: 20, expenses: 33 },
];

const fallbackSourceBreakdown = [
  { label: 'Corporate', value: 55200, color: '#1f7ae8', colorClass: 'corporate' },
  { label: 'Individual', value: 32150, color: '#67c2ef', colorClass: 'individual' },
  { label: 'Government', value: 12750, color: '#d5dde7', colorClass: 'government' },
];

const fallbackFinancialTransactions = [
  // { date: 'Oct 24, 2023', donor: 'Global Tech Inc.', type: 'Recurring', amount: '$12,500.00', status: 'Completed' },
  // { date: 'Oct 23, 2023', donor: 'Sarah Jenkins', type: 'One-time', amount: '$150.00', status: 'Completed' },
  // { date: 'Oct 22, 2023', donor: 'Robert Chen', type: 'Recurring', amount: '$45.00', status: 'Pending' },
  // { date: 'Oct 22, 2023', donor: 'Foundation Alpha', type: 'One-time', amount: '$5,000.00', status: 'Completed' },
  // { date: 'Oct 21, 2023', donor: 'Emily Rodriguez', type: 'One-time', amount: '$25.00', status: 'Completed' },
];

const fallbackMaterialSummaryCards = [
  // { title: 'Total Items Collected', value: '12,450', delta: '+12%', positive: true },
  // { title: 'Successful Deliveries', value: '10,120', delta: '+8%', positive: true },
  // { title: 'Pending Pickups', value: '850', delta: '-5%', positive: false },
  // { title: 'Delivery Success Rate', value: '81.2%', delta: '+2%', positive: true },
];

const fallbackMaterialBreakdown = [
  // { name: 'Clothing', percent: 45, tone: 'high' },
  // { name: 'Food', percent: 30, tone: 'medium' },
  // { name: 'Books', percent: 15, tone: 'low' },
  // { name: 'Medical Supplies', percent: 10, tone: 'low' },
];

const deliveryFlow = [
  { title: 'Pickup Scheduled', detail: '2,450 items pending', tone: 'scheduled' },
  { title: 'In Transit', detail: '1,120 items moving', tone: 'transit' },
  { title: 'Arrived at Hub', detail: 'Processing locally', tone: 'hub' },
  { title: 'Successfully Delivered', detail: '10,120 items complete', tone: 'delivered' },
];

const fallbackMaterialProvinceRows = [
  // { province: 'Phnom Penh', totalItems: '4,520', organization: 'Cambodian Red Cross', status: 'On Track', statusClass: 'on-track' },
  // { province: 'Siem Reap', totalItems: '2,840', organization: 'Angkor Hospital for Children', status: 'On Track', statusClass: 'on-track' },
  // { province: 'Battambang', totalItems: '1,950', organization: 'Krousar Thmey', status: 'Delayed', statusClass: 'delayed' },
  // { province: 'Kampot', totalItems: '1,210', organization: "Children's Future", status: 'On Track', statusClass: 'on-track' },
  // { province: 'Preah Sihanouk', totalItems: '930', organization: "M'Lop Tapang", status: 'Action Needed', statusClass: 'action-needed' },
];

const fallbackRegionalMetrics = [
  // { title: 'Provinces Covered', value: '25/25', delta: '+100%', positive: true },
  // { title: 'Active Community Projects', value: '1,482', delta: '+12.4%', positive: true },
  // { title: 'Regional Growth %', value: '28.5%', delta: 'YoY', positive: true },
];

const fallbackTopImpactProvinces = [
  // { rank: '01', name: 'Phnom Penh', projects: 524, amount: '$450,200', delta: '+18.5%' },
  // { rank: '02', name: 'Siem Reap', projects: 185, amount: '$210,000', delta: '+12.2%' },
  // { rank: '03', name: 'Battambang', projects: 124, amount: '$158,400', delta: '-2.8%' },
  // { rank: '04', name: 'Kampong Cham', projects: 98, amount: '$92,000', delta: '+5.4%' },
];

const fallbackCambodiaMapMarkers = [
  // { name: 'Phnom Penh', position: [11.5564, 104.9282], impact: 'High' },
  // { name: 'Siem Reap', position: [13.3633, 103.8564], impact: 'Medium' },
  // { name: 'Battambang', position: [13.1027, 103.1982], impact: 'Low' },
];

const fallbackRegionalProjectRows = [
  // { province: 'Phnom Penh', organization: 'Education First Network', campaigns: 156, impact: '$1.2M+', status: 'High Impact', statusClass: 'high' },
  // { province: 'Siem Reap', organization: 'Heritage Care Foundation', campaigns: 84, impact: '$780k', status: 'Medium Impact', statusClass: 'medium' },
  // { province: 'Preah Vihear', organization: 'Rural Health Alliance', campaigns: 22, impact: '$125k', status: 'Low Impact', statusClass: 'low' },
  // { province: 'Battambang', organization: 'Agri-Growth Khmer', campaigns: 65, impact: '$540k', status: 'Medium Impact', statusClass: 'medium' },
  // { province: 'Kandal', organization: 'Clean Water Project', campaigns: 112, impact: '$910k', status: 'High Impact', statusClass: 'high' },
];

function StatCard({ card }) {
  const Icon = card.icon;
  return (
    <article className="report-stat-card">
      <div className="report-stat-head">
        <p>{card.title}</p>
        <Icon size={18} />
      </div>
      <h3>{card.value}</h3>
      <span className={card.positive ? 'is-up' : 'is-down'}>{card.delta} vs last month</span>
    </article>
  );
}

function TrendChart({ data }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <article className="report-panel">
      <div className="report-panel-head">
        <h3>Donation Trends</h3>
        <span>Last 6 Months</span>
      </div>
      <div className="report-legend">
        <span><i className="financial" /> Financial ($)</span>
        <span><i className="material" /> Material (Units)</span>
      </div>
      {!hasData ? <p className="report-empty-note">No donation trend data yet.</p> : null}
      <div className="trend-chart">
        {data.map((item) => (
          <div key={item.month} className="trend-bar-group">
            <div className="trend-bars">
              <span className="bar financial" style={{ height: `${item.financial}%` }} />
              <span className="bar material" style={{ height: `${item.material}%` }} />
            </div>
            <label>{item.month}</label>
          </div>
        ))}
      </div>
    </article>
  );
}

function TypeBreakdown({
  financialValue,
  materialValue,
  selectedType,
  onSelect,
}) {
  const totalValue = financialValue + materialValue;
  const financialPercent = totalValue ? Math.round((financialValue / totalValue) * 100) : 0;
  const materialPercent = totalValue ? 100 - financialPercent : 0;
  const activePercent = selectedType === 'material' ? materialPercent : financialPercent;
  const activeLabel = selectedType === 'material' ? 'Material' : 'Financial';
  const formatCurrency = (value) => `$${value.toLocaleString()}`;
  const formatUnits = (value) => `${value.toLocaleString()} Units`;

  return (
    <article className="report-panel report-panel-narrow">
      <h3>Donation Type Breakdown</h3>
      <div
        className="report-donut"
        style={{
          background: `conic-gradient(#1f6fe6 0 ${financialPercent}%, #6ed7b7 ${financialPercent}% 100%)`,
        }}
      >
        <div className="report-donut-inner">
          <strong>{activePercent}%</strong>
          <span>{activeLabel}</span>
        </div>
      </div>
      <ul className="report-breakdown-list">
        <li>
          <button
            type="button"
            className={`report-breakdown-btn is-financial${selectedType === 'financial' ? ' is-active' : ''}`}
            onClick={() => onSelect('financial')}
            aria-pressed={selectedType === 'financial'}
          >
            <span className="dot financial" />
            <span className="label">Financial</span>
            <strong>{formatCurrency(financialValue)}</strong>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`report-breakdown-btn is-material${selectedType === 'material' ? ' is-active' : ''}`}
            onClick={() => onSelect('material')}
            aria-pressed={selectedType === 'material'}
          >
            <span className="dot material" />
            <span className="label">Material</span>
            <strong>{formatUnits(materialValue)}</strong>
          </button>
        </li>
      </ul>
    </article>
  );
}

function FinancialLineChart({ data }) {
  const chartData = Array.isArray(data) && data.length ? data : defaultRevenueExpenseData;
  const showExpenses = chartData.some((item) => Number(item.expenses) > 0);
  const maxValue = Math.max(1, ...chartData.map((item) => Math.max(item.revenue, showExpenses ? item.expenses : 0)));
  const columns = Math.max(1, chartData.length);

  return (
    <article className="financial-chart-panel">
      <div className="financial-panel-head">
        <div>
          <h3>Revenue</h3>
          <p>Monthly growth analysis</p>
        </div>
        <div className="financial-chart-legend">
          <span><i className="revenue" />Revenue</span>
          {showExpenses ? <span><i className="expenses" />Expenses</span> : null}
        </div>
      </div>

      <div className="financial-chart-body">
        <div className="financial-bar-grid" style={{ '--columns': columns }}>
          {chartData.map((item) => (
            <div key={item.month} className={`financial-bar-group${showExpenses ? '' : ' is-single'}`}>
              <span
                className="bar revenue"
                style={{ height: `${(item.revenue / maxValue) * 100}%` }}
                title={`Revenue: ${item.revenue}`}
              />
              {showExpenses ? (
                <span
                  className="bar expenses"
                  style={{ height: `${(item.expenses / maxValue) * 100}%` }}
                  title={`Expenses: ${item.expenses}`}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="financial-chart-months" style={{ '--columns': columns }}>
        {chartData.map((item) => <span key={item.month}>{item.month.toUpperCase()}</span>)}
      </div>
    </article>
  );
}

function SourceBreakdown({ items, orgId }) {
  const totalValue = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const hasData = totalValue > 0;
  const segments = items.map((item) => {
    const percent = hasData ? (Number(item.value) / totalValue) * 100 : 0;
    return {
      ...item,
      percent,
    };
  });
  const [animatedPercents, setAnimatedPercents] = useState(segments.map(() => 0));
  const [selectedLabel, setSelectedLabel] = useState('All');

  useEffect(() => {
    let frame = 0;
    const duration = 650;
    const start = performance.now();
    const targetPercents = segments.map((segment) => segment.percent);

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercents(targetPercents.map((percent) => percent * eased));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [items]);

  useEffect(() => {
    if (selectedLabel === 'All') return;
    const exists = segments.some((segment) => segment.label === selectedLabel);
    if (!exists) {
      setSelectedLabel('All');
    }
  }, [segments, selectedLabel]);

  let currentStop = 0;
  const gradientStops = segments.map((segment) => {
    const start = currentStop;
    const end = currentStop + segment.percent;
    currentStop = end;
    return `${segment.color} ${start}% ${end}%`;
  });

  const selectedSegment = segments.find((segment) => segment.label === selectedLabel);
  const activePercent = selectedLabel === 'All' ? 100 : (selectedSegment?.percent || 0);
  const activeColor = selectedSegment?.color || '#1f7ae8';

  const donutStyle = {
    background: hasData
      ? (selectedLabel === 'All'
        ? `conic-gradient(${gradientStops.join(', ')})`
        : `conic-gradient(${activeColor} 0 ${activePercent}%, #e5edf7 ${activePercent}% 100%)`)
      : 'conic-gradient(#e5edf7 0 100%)',
  };

  return (
    <article className="report-panel">
      <div className="report-panel-head">
        <h3>Source Breakdown</h3>
        <span className="report-panel-meta">Org ID: {orgId || 'All'}</span>
      </div>
      <p>Donations by category</p>
      <div className="report-donut" style={donutStyle}>
        <div className="report-donut-inner">
          <strong>{hasData ? `${Math.round(activePercent)}%` : '0%'}</strong>
          <span>Total Funding</span>
        </div>
      </div>
      {!hasData ? <p className="report-empty-note">No source data yet.</p> : null}
      <ul className="report-breakdown-list">
        <li>
          <button
            type="button"
            className={`report-breakdown-btn is-source${selectedLabel === 'All' ? ' is-active' : ''}`}
            onClick={() => setSelectedLabel('All')}
            aria-pressed={selectedLabel === 'All'}
          >
            <span className="dot" style={{ backgroundColor: '#1f7ae8' }} />
            <span className="label">All</span>
            <strong>{hasData ? '100%' : '0%'}</strong>
          </button>
        </li>
        {segments.map((item, index) => (
          <li key={item.label}>
            <button
              type="button"
              className={`report-breakdown-btn is-source${selectedLabel === item.label ? ' is-active' : ''}`}
              onClick={() => setSelectedLabel(item.label)}
              aria-pressed={selectedLabel === item.label}
            >
              <span
                className={`dot ${item.colorClass || ''}`}
                style={{ backgroundColor: item.color || '#cbd5e1' }}
              />
              <span className="label">{item.label}</span>
              <strong>{Math.round(animatedPercents[index] ?? item.percent)}%</strong>
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}


export default function OrganizationReports() {
  const reportOrgId = getOrganizationId(getOrganizationSession());
  const [activeTab, setActiveTab] = useState('overview');
  const [trendData, setTrendData] = useState(defaultTrendData);
  const [revenueExpenseData, setRevenueExpenseData] = useState(defaultRevenueExpenseData);
  const [selectedBreakdownType, setSelectedBreakdownType] = useState('financial');
  const breakdownUserSelectedRef = useRef(false);
  const [summaryMetrics, setSummaryMetrics] = useState(null);
  const [transactions, setTransactions] = useState(fallbackTransactions);
  const [financialSummaryMetrics, setFinancialSummaryMetrics] = useState(null);
  const [materialSummaryMetrics, setMaterialSummaryMetrics] = useState(null);
  const [sourceItems, setSourceItems] = useState(fallbackSourceBreakdown);
  const [financialRows, setFinancialRows] = useState(fallbackFinancialTransactions);
  const [materialBreakdownItems, setMaterialBreakdownItems] = useState(fallbackMaterialBreakdown);
  const [materialProvinceRows, setMaterialProvinceRows] = useState(fallbackMaterialProvinceRows);
  const [provinceRows, setProvinceRows] = useState(fallbackProvinces);
  const [regionalMetricsData, setRegionalMetricsData] = useState(fallbackRegionalMetrics);
  const [topImpactProvincesData, setTopImpactProvincesData] = useState(fallbackTopImpactProvinces);
  const [regionalProjectRowsData, setRegionalProjectRowsData] = useState(fallbackRegionalProjectRows);
  const [regionalMapMarkers, setRegionalMapMarkers] = useState(fallbackCambodiaMapMarkers);
  const [transactionMeta, setTransactionMeta] = useState({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
  });
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionType, setTransactionType] = useState('all');

  const handleExportPdf = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    const csvConfigs = {
      overview: {
        filename: `donation-reports-overview-${dateStamp}.csv`,
        rows: transactions,
        columns: [
          { label: 'Transaction ID', value: 'id' },
          { label: 'Donor Name', value: 'donor' },
          { label: 'Type', value: 'type' },
          { label: 'Province', value: 'province' },
          { label: 'Date', value: 'date' },
          { label: 'Amount', value: 'amount' },
        ],
      },
      financial: {
        filename: `donation-reports-financial-${dateStamp}.csv`,
        rows: financialRows,
        columns: [
          { label: 'Date', value: 'date' },
          { label: 'Donor', value: 'donor' },
          { label: 'Type', value: 'type' },
          { label: 'Amount', value: 'amount' },
          { label: 'Status', value: 'status' },
        ],
      },
      material: {
        filename: `donation-reports-material-${dateStamp}.csv`,
        rows: materialProvinceRows,
        columns: [
          { label: 'Province', value: 'province' },
          { label: 'Total Items', value: 'totalItems' },
          { label: 'Main Organization', value: 'organization' },
          { label: 'Status', value: 'status' },
        ],
      },
      regional: {
        filename: `donation-reports-regional-${dateStamp}.csv`,
        rows: regionalProjectRowsData,
        columns: [
          { label: 'Province', value: 'province' },
          { label: 'Main Organization', value: 'organization' },
          { label: 'Active Campaigns', value: 'campaigns' },
          { label: 'Total Impact', value: 'impact' },
          { label: 'Status', value: 'status' },
        ],
      },
    };

    const config = csvConfigs[activeTab] || csvConfigs.overview;
    const rows = Array.isArray(config.rows) ? config.rows : [];
    const csvContent = buildCsvContent(config.columns, rows);
    const contentWithBom = `\ufeff${csvContent}`;
    downloadTextFile(config.filename, contentWithBom, 'text/csv;charset=utf-8;');
  };

  useEffect(() => {
    let isMounted = true;

    const loadTrends = async () => {
      try {
        const response = await apiClient.get('/donation_trends');
        if (!Array.isArray(response.data)) {
          return;
        }

        const sorted = [...response.data]
          .sort((a, b) => (a?.month_index ?? 0) - (b?.month_index ?? 0))
          .map((item) => ({
            month: item.month,
            financial: Number(item.financial) || 0,
            material: Number(item.material) || 0,
          }));

        if (isMounted && sorted.length) {
          setTrendData(sorted);

          const revenueSeries = sorted.map((item) => ({
            month: item.month,
            revenue: Number(item.financial) || 0,
            expenses: 0,
          }));

          setRevenueExpenseData(revenueSeries);
        }
      } catch (error) {
        // Keep fallback data if API is unavailable.
      }
    };

    loadTrends();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);

    const formatDate = (value) => {
      if (!value) return 'N/A';
      const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value;
      const parsed = new Date(normalized);
      if (Number.isNaN(parsed.getTime())) return 'N/A';
      return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const loadFinancialTransactions = async () => {
      try {
        const fetchRows = async (params) => {
          const response = await apiClient.get('/organization_reports/financial_transactions', {
            params,
          });
          return Array.isArray(response.data) ? response.data : [];
        };

        let rows = await fetchRows(orgId ? { organization_id: orgId, limit: 5 } : { limit: 5 });
        if (!rows.length && orgId) {
          rows = await fetchRows({ limit: 5 });
        }

        const mapped = rows.map((row) => ({
          date: formatDate(row.date),
          donor: row.donor || 'Unknown Donor',
          type: row.type || 'One-time',
          amount: formatCurrency(row.amount),
          status: row.status || 'Pending',
        }));
        if (isMounted) {
          setFinancialRows(mapped);
        }
      } catch (error) {
        // Keep fallback data if API is unavailable.
      }
    };

    loadFinancialTransactions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);

    const loadRegionalMetrics = async () => {
      const mapRows = (rows) => rows.map((row) => ({
        title: row.title || 'Metric',
        value: row.value ?? '0',
        delta: row.delta ?? '',
        positive: row.positive ?? true,
      }));

      try {
        const scopedResponse = await apiClient.get('/regional_metrics', {
          params: orgId ? { organization_id: orgId, limit: 10 } : { limit: 10 },
        });
        if (Array.isArray(scopedResponse.data) && scopedResponse.data.length) {
          if (isMounted) {
            setRegionalMetricsData(mapRows(scopedResponse.data));
          }
          return;
        }

        if (orgId) {
          const fallbackResponse = await apiClient.get('/regional_metrics', {
            params: { limit: 10 },
          });
          if (Array.isArray(fallbackResponse.data) && fallbackResponse.data.length) {
            if (isMounted) {
              setRegionalMetricsData(mapRows(fallbackResponse.data));
            }
          }
        }
      } catch (error) {
        // Keep fallback data if API is unavailable.
      }
    };

    loadRegionalMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);

    const mapRows = (rows) => rows.map((row) => ({
      rank: String(row.rank || '').padStart(2, '0') || '00',
      name: row.province_name || row.name || 'Unknown',
      projects: Number(row.projects) || 0,
      amount: formatCurrency(row.amount ?? 0),
      delta: row.delta || '',
    }));

    const loadTopProvinces = async () => {
      try {
        const scopedResponse = await apiClient.get('/regional_top_provinces', {
          params: orgId ? { organization_id: orgId, limit: 10 } : { limit: 10 },
        });
        if (Array.isArray(scopedResponse.data) && scopedResponse.data.length) {
          if (isMounted) {
            setTopImpactProvincesData(mapRows(scopedResponse.data));
          }
          return;
        }

        if (orgId) {
          const fallbackResponse = await apiClient.get('/regional_top_provinces', {
            params: { limit: 10 },
          });
          if (Array.isArray(fallbackResponse.data) && fallbackResponse.data.length) {
            if (isMounted) {
              setTopImpactProvincesData(mapRows(fallbackResponse.data));
            }
          }
        }
      } catch (error) {
        // Keep fallback data if API is unavailable.
      }
    };

    loadTopProvinces();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);

    const mapRows = (rows) => rows.map((row) => ({
      province: row.province || 'Unknown',
      organization: row.organization_name || row.organization || 'Unknown',
      campaigns: Number(row.campaigns) || 0,
      impact: row.impact || '',
      status: row.status || 'Medium Impact',
      statusClass: regionalStatusClassFromLabel(row.status),
    }));

    const loadRegionalProjects = async () => {
      try {
        const scopedResponse = await apiClient.get('/regional_project_statuses', {
          params: orgId ? { organization_id: orgId, limit: 10 } : { limit: 10 },
        });
        if (Array.isArray(scopedResponse.data) && scopedResponse.data.length) {
          if (isMounted) {
            setRegionalProjectRowsData(mapRows(scopedResponse.data));
          }
          return;
        }

        if (orgId) {
          const fallbackResponse = await apiClient.get('/regional_project_statuses', {
            params: { limit: 10 },
          });
          if (Array.isArray(fallbackResponse.data) && fallbackResponse.data.length) {
            if (isMounted) {
              setRegionalProjectRowsData(mapRows(fallbackResponse.data));
            }
          }
        }
      } catch (error) {
        // Keep fallback data if API is unavailable.
      }
    };

    loadRegionalProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);

    const mapRows = (rows) => rows.map((row) => ({
      name: row.name || 'Unknown',
      position: [Number(row.latitude) || 0, Number(row.longitude) || 0],
      impact: row.impact || 'Medium',
    }));

    const loadMapMarkers = async () => {
      try {
        const scopedResponse = await apiClient.get('/regional_map_markers', {
          params: orgId ? { organization_id: orgId, limit: 200 } : { limit: 200 },
        });
        if (Array.isArray(scopedResponse.data) && scopedResponse.data.length) {
          if (isMounted) {
            setRegionalMapMarkers(mapRows(scopedResponse.data));
          }
          return;
        }

        if (orgId) {
          const fallbackResponse = await apiClient.get('/regional_map_markers', {
            params: { limit: 200 },
          });
          if (Array.isArray(fallbackResponse.data) && fallbackResponse.data.length) {
            if (isMounted) {
              setRegionalMapMarkers(mapRows(fallbackResponse.data));
            }
          }
        }
      } catch (error) {
        // Keep fallback data if API is unavailable.
      }
    };

    loadMapMarkers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);

    const mapRows = (rows) => rows.map((row) => ({
      province: row.province || 'Unknown',
      totalItems: formatWhole(row.total_items ?? row.totalItems ?? 0),
      organization: row.organization_name || row.organization || 'Unknown',
      status: row.status || 'On Track',
      statusClass: statusClassFromLabel(row.status),
    }));

    const loadMaterialProvinceRows = async () => {
      try {
        const scopedResponse = await apiClient.get('/material_province_distributions', {
          params: orgId ? { organization_id: orgId, limit: 10 } : { limit: 10 },
        });
        if (Array.isArray(scopedResponse.data) && scopedResponse.data.length) {
          if (isMounted) {
            setMaterialProvinceRows(mapRows(scopedResponse.data));
          }
          return;
        }

        if (orgId) {
          const fallbackResponse = await apiClient.get('/material_province_distributions', {
            params: { limit: 10 },
          });
          if (Array.isArray(fallbackResponse.data) && fallbackResponse.data.length) {
            if (isMounted) {
              setMaterialProvinceRows(mapRows(fallbackResponse.data));
            }
            return;
          }
        }
      } catch (error) {
        // Keep fallback data if API is unavailable.
      }
    };

    loadMaterialProvinceRows();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);

    const mapBreakdown = (items) => items.map((item) => {
      const percent = Number(item.percent) || 0;
      return {
        name: item.label || 'Unknown',
        percent,
        tone: item.tone || toneFromPercent(percent),
      };
    });

    const loadMaterialBreakdown = async () => {
      try {
        const scopedResponse = await apiClient.get('/material_breakdowns', {
          params: orgId ? { organization_id: orgId, limit: 10 } : { limit: 10 },
        });
        if (Array.isArray(scopedResponse.data) && scopedResponse.data.length) {
          if (isMounted) {
            setMaterialBreakdownItems(mapBreakdown(scopedResponse.data));
          }
          return;
        }

        if (orgId) {
          const fallbackResponse = await apiClient.get('/material_breakdowns', {
            params: { limit: 10 },
          });
          if (Array.isArray(fallbackResponse.data) && fallbackResponse.data.length) {
            if (isMounted) {
              setMaterialBreakdownItems(mapBreakdown(fallbackResponse.data));
            }
            return;
          }
        }
      } catch (error) {
        // Keep fallback data if API is unavailable.
      }
    };

    loadMaterialBreakdown();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);

    const loadMaterialSummary = async () => {
      try {
        const response = await apiClient.get('/organization_reports/material_summary', {
          params: orgId ? { organization_id: orgId } : undefined,
        });
        if (isMounted && response?.data) {
          setMaterialSummaryMetrics(response.data);
          return;
        }
      } catch (error) {
        // Fall back to unscoped data when org-specific fails.
      }

      try {
        const response = await apiClient.get('/organization_reports/material_summary');
        if (isMounted && response?.data) {
          setMaterialSummaryMetrics(response.data);
        }
      } catch (error) {
        // Keep fallback cards if API is unavailable.
      }
    };

    loadMaterialSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);
    const palette = [
      { color: '#1f7ae8', colorClass: 'corporate' },
      { color: '#67c2ef', colorClass: 'individual' },
      { color: '#d5dde7', colorClass: 'government' },
      { color: '#8fddc0', colorClass: '' },
      { color: '#7ba7ff', colorClass: '' },
    ];

    const loadSourceBreakdown = async () => {
      try {
        const scopedResponse = await apiClient.get('/source_breakdowns', {
          params: orgId ? { organization_id: orgId, limit: 10 } : { limit: 10 },
        });
        if (Array.isArray(scopedResponse.data) && scopedResponse.data.length) {
          const mapped = scopedResponse.data.map((item, index) => ({
            label: item.label,
            value: Number(item.value) || 0,
            ...palette[index % palette.length],
          }));
          if (isMounted) {
            setSourceItems(mapped);
          }
          return;
        }

        if (orgId) {
          const unscopedResponse = await apiClient.get('/source_breakdowns', {
            params: { limit: 10 },
          });
          if (Array.isArray(unscopedResponse.data) && unscopedResponse.data.length) {
            const mapped = unscopedResponse.data.map((item, index) => ({
              label: item.label,
              value: Number(item.value) || 0,
              ...palette[index % palette.length],
            }));
            if (isMounted) {
              setSourceItems(mapped);
            }
            return;
          }
        }
      } catch (error) {
        // Fall through to computed breakdown if cache API is unavailable.
      }

      try {
        const response = await apiClient.get('/organization_reports/source_breakdown', {
          params: orgId ? { organization_id: orgId } : undefined,
        });
        const items = response?.data?.items;
        if (isMounted && Array.isArray(items) && items.length) {
          const mapped = items.map((item, index) => ({
            label: item.label,
            value: Number(item.value) || 0,
            ...palette[index % palette.length],
          }));
          setSourceItems(mapped);
        }
      } catch (error) {
        // Keep fallback data if API is unavailable.
      }
    };

    loadSourceBreakdown();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);

    const loadSummary = async () => {
      try {
        const cacheResponse = await apiClient.get('/organization_metrics/cache', {
          params: orgId ? { organization_id: orgId } : undefined,
        });
        const cacheSummary = buildSummaryFromCache(cacheResponse?.data);
        if (isMounted && cacheSummary) {
          setSummaryMetrics(cacheSummary);
          return;
        }
      } catch (error) {
        // Fall back to live metrics when cache is unavailable.
      }

      try {
        const response = await apiClient.get('/organization_metrics/summary', {
          params: orgId ? { organization_id: orgId } : undefined,
        });

        if (isMounted && response?.data) {
          setSummaryMetrics(response.data);
        }
      } catch (error) {
        // Keep fallback cards if API is unavailable.
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);

    const formatDate = (value) => {
      if (!value) return 'N/A';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return 'N/A';
      return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatAmount = (row) => {
      if (row.type === 'Material') {
        const units = Number(row.material_units ?? row.amount_value ?? 0);
        return `${units.toLocaleString()} Units`;
      }
      const amount = Number(row.amount_value ?? 0);
      return formatCurrency(amount);
    };

    const fetchTransactions = async (params) => {
      const response = await apiClient.get('/organization_reports/transactions', { params });
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          meta: {
            total: response.data.length,
            per_page: params?.per_page ?? 10,
            current_page: params?.page ?? 1,
            last_page: 1,
            from: response.data.length ? 1 : 0,
            to: response.data.length,
          },
        };
      }
      return response.data || { data: [], meta: null };
    };

    const mapTransactions = (rows) => rows.map((row) => {
      const donorName = row.donor || 'Unknown Donor';
      const donorInitials = donorName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'OR';
      return {
        id: `#${row.code ?? row.id ?? 'TXN'}`,
        donor: donorName,
        initials: donorInitials,
        type: row.type || 'Financial',
        province: row.province || 'Unknown',
        date: formatDate(row.date),
        amount: formatAmount(row),
      };
    });

    const loadTransactions = async () => {
      try {
        const params = {
          page: transactionPage,
          per_page: 10,
          ...(orgId ? { organization_id: orgId } : {}),
          ...(transactionSearch.trim() ? { search: transactionSearch.trim() } : {}),
          ...(transactionType !== 'all' ? { type: transactionType } : {}),
        };
        const scopedResponse = await fetchTransactions(params);
        let responseToUse = scopedResponse;

        if (orgId && scopedResponse.data.length === 0) {
          const fallbackParams = {
            page: transactionPage,
            per_page: 10,
            ...(transactionSearch.trim() ? { search: transactionSearch.trim() } : {}),
            ...(transactionType !== 'all' ? { type: transactionType } : {}),
          };
          responseToUse = await fetchTransactions(fallbackParams);
        }

        const mapped = mapTransactions(responseToUse.data || []);
        if (isMounted) {
          setTransactions(mapped);
          if (responseToUse.meta) {
            setTransactionMeta(responseToUse.meta);
          } else {
            setTransactionMeta((prev) => ({
              ...prev,
              total: mapped.length,
              from: mapped.length ? 1 : 0,
              to: mapped.length,
              current_page: transactionPage,
              last_page: 1,
            }));
          }
        }
      } catch (error) {
        // Keep fallback data if API is unavailable.
      }
    };

    const timer = setTimeout(loadTransactions, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [transactionPage, transactionSearch, transactionType]);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);

    const loadFinancialSummary = async () => {
      try {
        const response = await apiClient.get('/organization_reports/financial_summary', {
          params: orgId ? { organization_id: orgId } : undefined,
        });
        if (isMounted && response?.data) {
          setFinancialSummaryMetrics(response.data);
          return;
        }
      } catch (error) {
        // Fall back to unscoped data when org-specific fails.
      }

      try {
        const response = await apiClient.get('/organization_reports/financial_summary');
        if (isMounted && response?.data) {
          setFinancialSummaryMetrics(response.data);
        }
      } catch (error) {
        // Keep fallback cards if API is unavailable.
      }
    };

    loadFinancialSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const session = getOrganizationSession();
    const orgId = getOrganizationId(session);

    const loadProvinces = async () => {
      try {
        const response = await apiClient.get('/province_contributions', {
          params: orgId ? { organization_id: orgId, limit: 5 } : { limit: 5 },
        });
        if (!Array.isArray(response.data) || response.data.length === 0) {
          return;
        }
        const totals = response.data.map((item) => Number(item.total_amount) || 0);
        const maxTotal = Math.max(1, ...totals);
        const mapped = response.data.map((item) => {
          const total = Number(item.total_amount) || 0;
          return {
            name: item.province_name || 'Unknown',
            amount: formatCurrency(total),
            width: Math.round((total / maxTotal) * 100),
          };
        });
        if (isMounted) {
          setProvinceRows(mapped);
        }
      } catch (error) {
        // Keep fallback data if API is unavailable.
      }
    };

    loadProvinces();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setTransactionPage(1);
  }, [transactionSearch, transactionType]);

  const breakdownTotals = trendData.reduce(
    (acc, item) => ({
      financial: acc.financial + (Number(item.financial) || 0),
      material: acc.material + (Number(item.material) || 0),
    }),
    { financial: 0, material: 0 }
  );
  const dominantBreakdownType = breakdownTotals.financial >= breakdownTotals.material ? 'financial' : 'material';

  useEffect(() => {
    if (!breakdownUserSelectedRef.current) {
      setSelectedBreakdownType(dominantBreakdownType);
    }
  }, [dominantBreakdownType]);

  const summaryCards = summaryMetrics?.metrics
    ? [
      {
        title: 'Total Revenue',
        value: formatCurrency(summaryMetrics.metrics.total_revenue?.value),
        delta: formatDelta(summaryMetrics.metrics.total_revenue?.delta_percent),
        positive: summaryMetrics.metrics.total_revenue?.positive ?? true,
        icon: Wallet,
      },
      {
        title: 'Active Donors',
        value: formatWhole(summaryMetrics.metrics.active_donors?.value),
        delta: formatDelta(summaryMetrics.metrics.active_donors?.delta_percent),
        positive: summaryMetrics.metrics.active_donors?.positive ?? true,
        icon: Users,
      },
      {
        title: 'Material Units',
        value: formatWhole(summaryMetrics.metrics.material_units?.value),
        delta: formatDelta(summaryMetrics.metrics.material_units?.delta_percent),
        positive: summaryMetrics.metrics.material_units?.positive ?? true,
        icon: Box,
      },
      {
        title: 'Avg. Donation',
        value: formatCurrency(summaryMetrics.metrics.avg_donation?.value),
        delta: formatDelta(summaryMetrics.metrics.avg_donation?.delta_percent),
        positive: summaryMetrics.metrics.avg_donation?.positive ?? true,
        icon: Tag,
      },
    ]
    : fallbackSummaryCards;

  const financialSummaryCards = financialSummaryMetrics?.metrics
    ? [
      {
        title: 'Total Revenue',
        value: formatCurrency(financialSummaryMetrics.metrics.total_revenue?.value),
        delta: formatDelta(financialSummaryMetrics.metrics.total_revenue?.delta_percent),
        positive: financialSummaryMetrics.metrics.total_revenue?.positive ?? true,
      },
      {
        title: 'Active Donors',
        value: formatWhole(financialSummaryMetrics.metrics.active_donors?.value),
        delta: formatDelta(financialSummaryMetrics.metrics.active_donors?.delta_percent),
        positive: financialSummaryMetrics.metrics.active_donors?.positive ?? true,
      },
      {
        title: 'Avg. Donation',
        value: formatCurrency(financialSummaryMetrics.metrics.avg_donation?.value),
        delta: formatDelta(financialSummaryMetrics.metrics.avg_donation?.delta_percent),
        positive: financialSummaryMetrics.metrics.avg_donation?.positive ?? true,
      },
      {
        title: 'Conversion Rate',
        value: formatPercent(financialSummaryMetrics.metrics.conversion_rate?.value),
        delta: formatDelta(financialSummaryMetrics.metrics.conversion_rate?.delta_percent),
        positive: financialSummaryMetrics.metrics.conversion_rate?.positive ?? true,
      },
    ]
    : fallbackFinancialSummaryCards;

  const materialSummaryCards = materialSummaryMetrics?.metrics
    ? [
      {
        title: 'Total Items Collected',
        value: formatWhole(materialSummaryMetrics.metrics.total_items_collected?.value),
        delta: formatDelta(materialSummaryMetrics.metrics.total_items_collected?.delta_percent),
        positive: materialSummaryMetrics.metrics.total_items_collected?.positive ?? true,
      },
      {
        title: 'Successful Deliveries',
        value: formatWhole(materialSummaryMetrics.metrics.successful_deliveries?.value),
        delta: formatDelta(materialSummaryMetrics.metrics.successful_deliveries?.delta_percent),
        positive: materialSummaryMetrics.metrics.successful_deliveries?.positive ?? true,
      },
      {
        title: 'Pending Pickups',
        value: formatWhole(materialSummaryMetrics.metrics.pending_pickups?.value),
        delta: formatDelta(materialSummaryMetrics.metrics.pending_pickups?.delta_percent),
        positive: materialSummaryMetrics.metrics.pending_pickups?.positive ?? true,
      },
      {
        title: 'Delivery Success Rate',
        value: formatPercent(materialSummaryMetrics.metrics.delivery_success_rate?.value),
        delta: formatDelta(materialSummaryMetrics.metrics.delivery_success_rate?.delta_percent),
        positive: materialSummaryMetrics.metrics.delivery_success_rate?.positive ?? true,
      },
    ]
    : fallbackMaterialSummaryCards;

  return (
    <div className="org-page report-page">
      <OrganizationSidebar />

      <div className="report-main-shell">

        <main className="report-main">
          <section className="report-title-row">
            <div>
              <h1>Donation Reports</h1>
              <p>Comprehensive view of donation trends, material impact, and regional performance.</p>
            </div>
            <div className="report-export-actions">
              <button type="button" onClick={handleExportPdf}><Download size={14} /> Export PDF</button>
              <button type="button" className="primary" onClick={handleExportCsv}><Download size={14} /> Export CSV</button>
            </div>
          </section>

          <section className="report-tabs">
            <button type="button" className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
            <button type="button" className={activeTab === 'financial' ? 'active' : ''} onClick={() => setActiveTab('financial')}>Financial Analysis</button>
            <button type="button" className={activeTab === 'material' ? 'active' : ''} onClick={() => setActiveTab('material')}>Material Distribution</button>
            <button type="button" className={activeTab === 'regional' ? 'active' : ''} onClick={() => setActiveTab('regional')}>Regional Impact</button>
          </section>

          
          <section className={`report-tab-content${activeTab === 'overview' ? '' : ' is-hidden'}`}>
            <section className="report-stats">
              {summaryCards.map((card) => <StatCard key={card.title} card={card} />)}
            </section>

            <section className="report-grid-top">
              <TrendChart data={trendData} />
              <TypeBreakdown
                financialValue={breakdownTotals.financial}
                materialValue={breakdownTotals.material}
                selectedType={selectedBreakdownType}
                onSelect={(type) => {
                  breakdownUserSelectedRef.current = true;
                  setSelectedBreakdownType(type);
                }}
              />
            </section>

            <section className="report-table-panel">
              <div className="report-panel-head">
                <h3>Recent Transactions</h3>
                <div className="report-table-tools">
                  <div className="report-search">
                    <Search size={14} />
                    <input
                      type="search"
                      placeholder="Search by donor or ID..."
                      value={transactionSearch}
                      onChange={(event) => setTransactionSearch(event.target.value)}
                    />
                  </div>
                  <label className="report-filter-select">
                    <Filter size={14} />
                    <select value={transactionType} onChange={(event) => setTransactionType(event.target.value)}>
                      <option value="all">All</option>
                      <option value="financial">Financial</option>
                      <option value="material">Material</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="report-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Donor Name</th>
                      <th>Type</th>
                      <th>Province</th>
                      <th>Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>
                          <div className="report-donor-cell">
                            <span>{row.initials}</span>
                            {row.donor}
                          </div>
                        </td>
                        <td><span className={`type-pill ${row.type.toLowerCase()}`}>{row.type}</span></td>
                        <td>{row.province}</td>
                        <td>{row.date}</td>
                        <td className="amount">{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="report-table-footer">
                <p>
                  Showing {transactionMeta.from} to {transactionMeta.to} of {transactionMeta.total} transactions
                </p>
                <div className="report-pagination">
                  <button
                    type="button"
                    disabled={transactionMeta.current_page <= 1}
                    onClick={() => setTransactionPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                  {getPageRange(transactionMeta.current_page, transactionMeta.last_page).map((pageNumber) => (
                    <button
                      type="button"
                      key={pageNumber}
                      className={pageNumber === transactionMeta.current_page ? 'active' : ''}
                      onClick={() => setTransactionPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={transactionMeta.current_page >= transactionMeta.last_page}
                    onClick={() => setTransactionPage((prev) => Math.min(transactionMeta.last_page, prev + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>

            <section className="report-grid-bottom">
              <article className="report-panel">
                <h3>Top Contributing Provinces</h3>
                <div className="province-list">
                  {provinceRows.map((province) => (
                    <div key={province.name} className="province-item">
                      <div className="province-head">
                        <strong>{province.name}</strong>
                        <span>{province.amount}</span>
                      </div>
                      <div className="province-track"><i style={{ width: `${province.width}%` }} /></div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="report-panel">
                <div className="report-panel-head">
                  <h3>Regional Impact Map</h3>
                  <span className="report-impact-level"><MapPin size={14} /> High impact</span>
                </div>
                <div className="map-placeholder">
                  <div className="map-bubble b1">60%</div>
                  <div className="map-bubble b2">85%</div>
                  <div className="map-bubble b3">35%</div>
                  <div className="map-note">
                    <p>Active Regions</p>
                    <strong>25 / 25 Provinces</strong>
                  </div>
                </div>
                <p className="map-caption">Our impact reaches across all provinces, with the highest concentration in urban centers and key rural development zones.</p>
                <button type="button" className="map-btn">Launch Interactive Map Explorer</button>
              </article>
            </section>
          </section>

          <section className={`report-tab-content financial-tab${activeTab === 'financial' ? '' : ' is-hidden'}`}>
            <section className="financial-summary-grid">
              {financialSummaryCards.map((card) => (
                <article key={card.title} className="financial-summary-card">
                  <p>{card.title}</p>
                  <div>
                    <strong>{card.value}</strong>
                    <span className={card.positive ? 'is-up' : 'is-down'}>{card.delta}</span>
                  </div>
                </article>
              ))}
            </section>

            <section className="financial-analysis-grid">
              <FinancialLineChart data={revenueExpenseData} />

              <SourceBreakdown items={sourceItems} orgId={reportOrgId} />
            </section>

            <section className="financial-table-panel">
              <div className="financial-table-head">
                <h3>Financial Transactions</h3>
                <button type="button" onClick={handleExportCsv}>Export CSV</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Donor</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {financialRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="report-empty-note">No financial transactions yet.</td>
                    </tr>
                  ) : (
                    financialRows.map((row) => (
                      <tr key={`${row.date}-${row.donor}`}>
                        <td>{row.date}</td>
                        <td className="donor">{row.donor}</td>
                        <td>{row.type}</td>
                        <td className="amount">{row.amount}</td>
                        <td>
                          <span className={`status ${row.status.toLowerCase()}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="financial-table-footer">
                <p>Showing {financialRows.length} transaction{financialRows.length === 1 ? '' : 's'}</p>
                <div className="financial-table-pagination">
                  <button type="button">Previous</button>
                  <button type="button">Next</button>
                </div>
              </div>
            </section>
          </section>

          <section className={`report-tab-content material-tab${activeTab === 'material' ? '' : ' is-hidden'}`}>
            <section className="material-summary-grid">
              {materialSummaryCards.map((card) => (
                <article key={card.title} className="material-summary-card">
                  <p>{card.title}</p>
                  <strong>{card.value}</strong>
                  <span className={card.positive ? 'is-up' : 'is-down'}>{card.delta}</span>
                </article>
              ))}
            </section>

            <section className="material-main-grid">
              <article className="material-breakdown-panel">
                <h3>Material Breakdown</h3>
                <div className="material-breakdown-list">
                  {materialBreakdownItems.map((item) => (
                    <div key={item.name} className="material-breakdown-item">
                      <div className="material-breakdown-head">
                        <p>{item.name}</p>
                        <span>{item.percent}%</span>
                      </div>
                      <div className="material-track">
                        <i className={item.tone} style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="material-flow-panel">
                <h3>Delivery Flow</h3>
                <ul className="material-flow-list">
                  {deliveryFlow.map((step) => (
                    <li key={step.title}>
                      <span className={`flow-dot ${step.tone}`} />
                      <div>
                        <strong>{step.title}</strong>
                        <p>{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="material-table-panel">
              <div className="material-table-head">
                <h3>Distribution by Province</h3>
                <button type="button">View All</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Province</th>
                    <th>Total Items</th>
                    <th>Main Organization</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {materialProvinceRows.map((row) => (
                    <tr key={row.province}>
                      <td>{row.province}</td>
                      <td>{row.totalItems}</td>
                      <td>{row.organization}</td>
                      <td>
                        <span className={`material-status ${row.statusClass}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </section>

          <section className={`report-tab-content regional-tab${activeTab === 'regional' ? '' : ' is-hidden'}`}>
            <section className="regional-metrics-grid">
              {regionalMetricsData.map((item) => (
                <article key={item.title} className="regional-metric-card">
                  <p>{item.title}</p>
                  <div>
                    <strong>{item.value}</strong>
                    <span className={item.positive ? 'is-up' : 'is-down'}>{item.delta}</span>
                  </div>
                </article>
              ))}
            </section>

            <section className="regional-filter-bar">
              <button type="button">All Categories</button>
              <button type="button">Last 12 Months</button>
              <button type="button" className="active">Education</button>
              <button type="button">Health</button>
            </section>

            <section className="regional-main-grid">
              <article className="regional-top-panel">
                <h3>Top Impact Provinces</h3>
                <ul className="regional-top-list">
                  {topImpactProvincesData.map((row) => (
                    <li key={row.rank}>
                      <span className="rank">{row.rank}</span>
                      <div className="meta">
                        <strong>{row.name}</strong>
                        <p>{row.projects} Active Projects</p>
                      </div>
                      <div className="value">
                        <strong>{row.amount}</strong>
                        <p className={row.delta.startsWith('-') ? 'is-down' : 'is-up'}>{row.delta}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <button type="button" className="regional-view-all">View All Provinces</button>
              </article>
            </section>

            <section className="regional-table-panel">
              <div className="regional-table-head">
                <h3>Provincial Project Status</h3>
                <div className="regional-sort">
                  <span>Sort by:</span>
                  <button type="button">Impact Status</button>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Province</th>
                    <th>Main Organization</th>
                    <th>Active Campaigns</th>
                    <th>Total Impact</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {regionalProjectRowsData.map((row) => (
                    <tr key={row.province}>
                      <td className="province">{row.province}</td>
                      <td>{row.organization}</td>
                      <td>{row.campaigns}</td>
                      <td className="impact">{row.impact}</td>
                      <td>
                        <span className={`regional-status ${row.statusClass}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="regional-table-footer">
                <p>Showing 1 to 5 of 25 provinces</p>
                <div className="regional-pagination">
                  <button type="button">Previous</button>
                  <button type="button" className="active">1</button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <button type="button">Next</button>
                </div>
              </div>
            </section>
          </section>
        </main>

      </div>
    </div>
  );
}
