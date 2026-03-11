import { useEffect, useState } from 'react';
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

// Summary card in overview
const summaryCards = [
  { title: 'Total Revenue', value: '$128,450', delta: '+14.2%', positive: true, icon: Wallet },
  { title: 'Active Donors', value: '4,281', delta: '+5.8%', positive: true, icon: Users },
  { title: 'Material Units', value: '12,540', delta: '-2.1%', positive: false, icon: Box },
  { title: 'Avg. Donation', value: '$42.50', delta: '+8.4%', positive: true, icon: Tag },
];

// Donation Trends data in overview
const defaultTrendData = [
  { month: 'Jan', financial: 32, material: 24 },
  { month: 'Feb', financial: 44, material: 35 },
  { month: 'Mar', financial: 36, material: 47 },
  { month: 'Apr', financial: 60, material: 32 },
  { month: 'May', financial: 52, material: 63 },
  { month: 'Jun', financial: 72, material: 39 },
  { month: 'Jul', financial: 90, material: 10 },
  { month: 'Aug', financial: 87, material: 60 },
  { month: 'Sep', financial: 67, material: 46 },
  { month: 'Oct', financial: 94, material: 39 },
  { month: 'Nov', financial: 82, material: 39 },
  { month: 'Dec', financial: 79, material: 85 },
];

const transactions = [
  { id: '#TXN-8821', donor: 'Robert Kim', initials: 'RK', type: 'Financial', province: 'Phnom Penh', date: 'Oct 24, 2023', amount: '$250.00' },
  { id: '#TXN-8819', donor: 'Sophea Lim', initials: 'SL', type: 'Material', province: 'Siem Reap', date: 'Oct 23, 2023', amount: '40 Units' },
  { id: '#TXN-8815', donor: 'Channy Watt', initials: 'CW', type: 'Financial', province: 'Battambang', date: 'Oct 22, 2023', amount: '$1,200.00' },
];

const provinces = [
  { name: 'Phnom Penh', amount: '$45,200', width: 85 },
  { name: 'Siem Reap', amount: '$28,150', width: 60 },
  { name: 'Battambang', amount: '$15,400', width: 35 },
];

const financialSummaryCards = [
  { title: 'Total Revenue', value: '$128,450', delta: '+14.2%', positive: true },
  { title: 'Active Donors', value: '4,281', delta: '+5.8%', positive: true },
  { title: 'Avg. Donation', value: '$42.50', delta: '+8.4%', positive: true },
  { title: 'Conversion Rate', value: '3.2%', delta: '-1.1%', positive: false },
];

// Revenue vs. Expenses
const revenueExpenseData = [
  { month: 'Jan', revenue: 10, expenses: 18 },
  { month: 'Feb', revenue: 31, expenses: 16 },
  { month: 'Mar', revenue: 38, expenses: 20 },
  { month: 'Apr', revenue: 40, expenses: 15 },
  { month: 'May', revenue: 36, expenses: 19 },
  { month: 'Jun', revenue: 24, expenses: 22 },
  { month: 'Jul', revenue: 30, expenses: 25 },
  { month: 'Aug', revenue: 20, expenses: 33 },
];

const sourceBreakdown = [
  { label: 'Corporate', value: 55, colorClass: 'corporate' },
  { label: 'Individual', value: 32, colorClass: 'individual' },
  { label: 'Government', value: 13, colorClass: 'government' },
];

const financialTransactions = [
  { date: 'Oct 24, 2023', donor: 'Global Tech Inc.', type: 'Recurring', amount: '$12,500.00', status: 'Completed' },
  { date: 'Oct 23, 2023', donor: 'Sarah Jenkins', type: 'One-time', amount: '$150.00', status: 'Completed' },
  { date: 'Oct 22, 2023', donor: 'Robert Chen', type: 'Recurring', amount: '$45.00', status: 'Pending' },
  { date: 'Oct 22, 2023', donor: 'Foundation Alpha', type: 'One-time', amount: '$5,000.00', status: 'Completed' },
  { date: 'Oct 21, 2023', donor: 'Emily Rodriguez', type: 'One-time', amount: '$25.00', status: 'Completed' },
];

const materialSummaryCards = [
  { title: 'Total Items Collected', value: '12,450', delta: '+12%', positive: true },
  { title: 'Successful Deliveries', value: '10,120', delta: '+8%', positive: true },
  { title: 'Pending Pickups', value: '850', delta: '-5%', positive: false },
  { title: 'Delivery Success Rate', value: '81.2%', delta: '+2%', positive: true },
];

const materialBreakdown = [
  { name: 'Clothing', percent: 45, tone: 'high' },
  { name: 'Food', percent: 30, tone: 'medium' },
  { name: 'Books', percent: 15, tone: 'low' },
  { name: 'Medical Supplies', percent: 10, tone: 'xlow' },
];

const deliveryFlow = [
  { title: 'Pickup Scheduled', detail: '2,450 items pending', tone: 'scheduled' },
  { title: 'In Transit', detail: '1,120 items moving', tone: 'transit' },
  { title: 'Arrived at Hub', detail: 'Processing locally', tone: 'hub' },
  { title: 'Successfully Delivered', detail: '10,120 items complete', tone: 'delivered' },
];

const materialProvinceRows = [
  { province: 'Phnom Penh', totalItems: '4,520', organization: 'Cambodian Red Cross', status: 'On Track', statusClass: 'on-track' },
  { province: 'Siem Reap', totalItems: '2,840', organization: 'Angkor Hospital for Children', status: 'On Track', statusClass: 'on-track' },
  { province: 'Battambang', totalItems: '1,950', organization: 'Krousar Thmey', status: 'Delayed', statusClass: 'delayed' },
  { province: 'Kampot', totalItems: '1,210', organization: "Children's Future", status: 'On Track', statusClass: 'on-track' },
  { province: 'Preah Sihanouk', totalItems: '930', organization: "M'Lop Tapang", status: 'Action Needed', statusClass: 'action-needed' },
];

const regionalMetrics = [
  { title: 'Provinces Covered', value: '25/25', delta: '+100%', positive: true },
  { title: 'Active Community Projects', value: '1,482', delta: '+12.4%', positive: true },
  { title: 'Regional Growth %', value: '28.5%', delta: 'YoY', positive: true },
];

const topImpactProvinces = [
  { rank: '01', name: 'Phnom Penh', projects: 524, amount: '$450,200', delta: '+18.5%' },
  { rank: '02', name: 'Siem Reap', projects: 185, amount: '$210,000', delta: '+12.2%' },
  { rank: '03', name: 'Battambang', projects: 124, amount: '$158,400', delta: '-2.8%' },
  { rank: '04', name: 'Kampong Cham', projects: 98, amount: '$92,000', delta: '+5.4%' },
];

const cambodiaMapMarkers = [
  { name: 'Phnom Penh', position: [11.5564, 104.9282], impact: 'High' },
  { name: 'Siem Reap', position: [13.3633, 103.8564], impact: 'Medium' },
  { name: 'Battambang', position: [13.1027, 103.1982], impact: 'Low' },
];

const regionalProjectRows = [
  { province: 'Phnom Penh', organization: 'Education First Network', campaigns: 156, impact: '$1.2M+', status: 'High Impact', statusClass: 'high' },
  { province: 'Siem Reap', organization: 'Heritage Care Foundation', campaigns: 84, impact: '$780k', status: 'Medium Impact', statusClass: 'medium' },
  { province: 'Preah Vihear', organization: 'Rural Health Alliance', campaigns: 22, impact: '$125k', status: 'Low Impact', statusClass: 'low' },
  { province: 'Battambang', organization: 'Agri-Growth Khmer', campaigns: 65, impact: '$540k', status: 'Medium Impact', statusClass: 'medium' },
  { province: 'Kandal', organization: 'Clean Water Project', campaigns: 112, impact: '$910k', status: 'High Impact', statusClass: 'high' },
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

function TypeBreakdown() {
  return (
    <article className="report-panel report-panel-narrow">
      <h3>Donation Type Breakdown</h3>
      <div className="report-donut">
        <div className="report-donut-inner">
          <strong>72%</strong>
          <span>Financial</span>
        </div>
      </div>
      <ul className="report-breakdown-list">
        <li><span className="dot financial" />Financial <strong>$92,484</strong></li>
        <li><span className="dot material" />Material <strong>12,540 Units</strong></li>
      </ul>
    </article>
  );
}

function FinancialLineChart() {
  const maxValue = Math.max(...revenueExpenseData.map((item) => Math.max(item.revenue, item.expenses)));

  return (
    <article className="financial-chart-panel">
      <div className="financial-panel-head">
        <div>
          <h3>Revenue vs. Expenses</h3>
          <p>Monthly growth analysis</p>
        </div>
        <div className="financial-chart-legend">
          <span><i className="revenue" />Revenue</span>
          <span><i className="expenses" />Expenses</span>
        </div>
      </div>

      <div className="financial-chart-body">
        <div className="financial-bar-grid">
          {revenueExpenseData.map((item) => (
            <div key={item.month} className="financial-bar-group">
              <span className="bar revenue" style={{ height: `${(item.revenue / maxValue) * 100}%` }} />
              <span className="bar expenses" style={{ height: `${(item.expenses / maxValue) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="financial-chart-months">
        {revenueExpenseData.map((item) => <span key={item.month}>{item.month.toUpperCase()}</span>)}
      </div>
    </article>
  );
}

export default function OrganizationReports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [trendData, setTrendData] = useState(defaultTrendData);

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

  return (
    <div className="org-page report-page">
      <OrganizationSidebar compact />

      <div className="report-main-shell">

        <main className="report-main">
          <section className="report-title-row">
            <div>
              <h1>Donation Reports</h1>
              <p>Comprehensive view of donation trends, material impact, and regional performance.</p>
            </div>
            <div className="report-export-actions">
              <button type="button"><Download size={14} /> Export PDF</button>
              <button type="button" className="primary"><Download size={14} /> Export CSV</button>
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
              <TypeBreakdown />
            </section>

            <section className="report-table-panel">
              <div className="report-panel-head">
                <h3>Recent Transactions</h3>
                <div className="report-table-tools">
                  <div className="report-search">
                    <Search size={14} />
                    <input type="search" placeholder="Search by donor or ID..." />
                  </div>
                  <button type="button" className="report-filter-btn"><Filter size={14} /> Filter</button>
                </div>
              </div>
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
              <div className="report-table-footer">
                <p>Showing 1 to 3 of 156 transactions</p>
                <div className="report-pagination">
                  <button type="button">Previous</button>
                  <button type="button" className="active">1</button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <button type="button">Next</button>
                </div>
              </div>
            </section>

            <section className="report-grid-bottom">
              <article className="report-panel">
                <h3>Top Contributing Provinces</h3>
                <div className="province-list">
                  {provinces.map((province) => (
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
              <FinancialLineChart />

              <article className="financial-source-panel">
                <div className="financial-panel-head">
                  <div>
                    <h3>Source Breakdown</h3>
                    <p>Donations by category</p>
                  </div>
                </div>
                <div className="financial-source-donut">
                  <div className="financial-source-inner">
                    <strong>100%</strong>
                    <span>TOTAL FUNDING</span>
                  </div>
                </div>
                <ul className="financial-source-list">
                  {sourceBreakdown.map((item) => (
                    <li key={item.label}>
                      <span className={`dot ${item.colorClass}`} />
                      <p>{item.label}</p>
                      <strong>{item.value}%</strong>
                    </li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="financial-table-panel">
              <div className="financial-table-head">
                <h3>Financial Transactions</h3>
                <button type="button">Export CSV</button>
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
                  {financialTransactions.map((row) => (
                    <tr key={`${row.date}-${row.donor}`}>
                      <td>{row.date}</td>
                      <td className="donor">{row.donor}</td>
                      <td>{row.type}</td>
                      <td className="amount">{row.amount}</td>
                      <td>
                        <span className={`status ${row.status.toLowerCase()}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="financial-table-footer">
                <p>Showing 5 of 1,248 transactions</p>
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
                  {materialBreakdown.map((item) => (
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
              {regionalMetrics.map((item) => (
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
              <article className="regional-map-panel">
                <div className="regional-panel-head">
                  <h3>Impact Density Map</h3>
                  <div className="regional-map-legend">
                    <span><i className="low" />Low</span>
                    <span><i className="medium" />Med</span>
                    <span><i className="high" />High</span>
                  </div>
                </div>
                <div className="regional-map-placeholder">
                  <MapContainer
                    center={[12.5657, 104.991]}
                    zoom={7}
                    minZoom={6}
                    maxZoom={12}
                    scrollWheelZoom
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {cambodiaMapMarkers.map((marker) => (
                      <Marker key={marker.name} position={marker.position}>
                        <Popup>
                          <strong>{marker.name}</strong>
                          <br />
                          Impact: {marker.impact}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </article>

              <article className="regional-top-panel">
                <h3>Top Impact Provinces</h3>
                <ul className="regional-top-list">
                  {topImpactProvinces.map((row) => (
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
                  {regionalProjectRows.map((row) => (
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
