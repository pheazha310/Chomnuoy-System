import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ClipboardCheck,
  PackageCheck,
  Filter,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  Truck,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buildMaterialWorkflowRows, getMaterialWorkflowResources, updateMaterialWorkflowStatus } from '@/services/material-workflow-service.js';
import './PickupsTableAdmin.css';

const PAGE_SIZE = 5;
const DEFAULT_CENTER = [11.5564, 104.9282];
const statusClasses = {
  Pending: 'pickup-status-pending',
  Assigned: 'pickup-status-assigned',
  'In Transit': 'pickup-status-transit',
  Completed: 'pickup-status-completed',
  Cancelled: 'pickup-status-pending',
};
const categoryClasses = {
  Clothing: 'pickup-tag-clothing',
  Education: 'pickup-tag-education',
  'Food Supply': 'pickup-tag-food',
  Household: 'pickup-tag-household',
  Other: 'pickup-tag-generic',
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function safeSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateLabel(value) {
  const parsed = parseDate(value);
  if (!parsed) return value || '-';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function sameDay(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function isInThisWeek(date) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

function matchesDateFilter(date, filter) {
  if (!date || filter === 'All Time') return true;
  const now = new Date();
  if (filter === 'Today') return sameDay(date, now);
  if (filter === 'This Week') return isInThisWeek(date);
  if (filter === 'This Month') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  if (filter === 'Last 30 Days') {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 30);
    return date >= threshold;
  }
  return true;
}

function extractProvince(item, fallbackAddress = '') {
  const direct =
    item.province ||
    item.city ||
    item.state ||
    item.region ||
    item.location_name;
  if (direct) return String(direct).trim();

  const address = String(fallbackAddress || '').trim();
  if (!address) return 'Unknown';
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || 'Unknown';
}

export default function PickupsTable() {
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openFilter, setOpenFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [filters, setFilters] = useState({
    status: 'All',
    date: 'This Week',
    province: 'All',
  });

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const resources = await getMaterialWorkflowResources();
        if (!active) return;
        const mapped = buildMaterialWorkflowRows(resources).map((row) => ({
          id: row.pickupId || row.id,
          pickupId: row.pickupId,
          donationId: row.donationId,
          donorUserId: row.donorUserId,
          initials: row.donorInitials || getInitials(row.donorName, 'DN'),
          name: row.donorName,
          org: row.organizationName,
          category: row.category,
          date: row.scheduleDateLabel,
          pickupDate: parseDate(row.scheduleDateRaw),
          status: row.adminStatusLabel,
          province: extractProvince(row.pickup || {}, row.pickupAddress),
          quantity: row.quantity,
          lat: Number.isFinite(row.lat) ? row.lat : null,
          lng: Number.isFinite(row.lng) ? row.lng : null,
          address: row.pickupAddress,
          scheduleDateRaw: row.scheduleDateRaw,
          campaignTitle: row.campaignTitle,
        }));

        setRows(mapped);
        setCurrentPage(1);
        if (mapped.length > 0) {
          const firstWithLocation = mapped.find((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
          if (firstWithLocation) {
            setMapCenter([firstWithLocation.lat, firstWithLocation.lng]);
          }
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load pickups.');
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const provinceOptions = useMemo(() => {
    const values = Array.from(new Set(rows.map((row) => row.province).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    return ['All', ...values];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return rows
      .filter((row) => filters.status === 'All' || row.status === filters.status)
      .filter((row) => filters.province === 'All' || row.province === filters.province)
      .filter((row) => matchesDateFilter(row.pickupDate, filters.date))
      .filter((row) => {
        if (!query) return true;
        return `${row.name} ${row.org} ${row.category} ${row.date} ${row.status} ${row.province} ${row.address}`
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => (b.pickupDate?.getTime() || 0) - (a.pickupDate?.getTime() || 0));
  }, [filters.date, filters.province, filters.status, rows, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const pending = rows.filter((row) => row.status === 'Pending').length;
    const inTransit = rows.filter((row) => row.status === 'In Transit').length;
    const completed = rows.filter((row) => row.status === 'Completed').length;
    const totalItems = rows.reduce((sum, row) => sum + row.quantity, 0);

    return [
      { label: 'Pending Pickups', value: pending.toLocaleString(), change: `${rows.length ? Math.round((pending / rows.length) * 100) : 0}%`, tone: 'warning', icon: ClipboardCheck },
      { label: 'In Transit', value: inTransit.toLocaleString(), change: `${rows.length ? Math.round((inTransit / rows.length) * 100) : 0}%`, tone: 'info', icon: Truck },
      { label: 'Successfully Delivered', value: completed.toLocaleString(), change: `${rows.length ? Math.round((completed / rows.length) * 100) : 0}%`, tone: 'success', icon: CheckCircle2 },
      { label: 'Total Items Collected', value: totalItems.toLocaleString(), change: `${new Set(rows.map((row) => row.org)).size} orgs`, tone: 'purple', icon: PackageCheck },
    ];
  }, [rows]);

  const mapMarkers = useMemo(
    () => rows.filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng)),
    [rows]
  );

  const organizationActivity = useMemo(() => {
    const counts = new Map();
    rows.forEach((row) => {
      counts.set(row.org, (counts.get(row.org) || 0) + 1);
    });
    const topCount = Math.max(...counts.values(), 1);
    return Array.from(counts.entries())
      .map(([team, count]) => ({
        team,
        percent: Math.round((count / topCount) * 100),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [rows]);

  const pickupSummary = useMemo(() => {
    const total = rows.length;
    const mapped = mapMarkers.length;
    const organizations = new Set(rows.map((row) => row.org).filter(Boolean)).size;
    const pending = rows.filter((row) => row.status === 'Pending').length;
    const completionRate = total ? Math.round((rows.filter((row) => row.status === 'Completed').length / total) * 100) : 0;

    return {
      total,
      mapped,
      organizations,
      pending,
      completionRate,
    };
  }, [mapMarkers.length, rows]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(coords);
        setMapCenter([coords.latitude, coords.longitude]);
        setLocationError('');
      },
      (err) => {
        setLocationError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const toggleMenu = (id) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleStatusUpdate = async (pickup, nextStatus) => {
    if (!pickup.pickupId || !pickup.donationId) return;
    setUpdatingId(pickup.id);
    try {
      await updateMaterialWorkflowStatus({
        pickupId: pickup.pickupId,
        donationId: pickup.donationId,
        pickupPatch: {
          status: nextStatus,
          pickup_address: pickup.address,
          schedule_date: pickup.scheduleDateRaw,
        },
        donationStatus: nextStatus,
        notification: pickup.donorUserId ? {
          user_id: pickup.donorUserId,
          message: `Your material donation for "${pickup.campaignTitle}" is now ${nextStatus.replaceAll('_', ' ')}.`,
          type: 'material-workflow-update',
        } : null,
      });
      const labelMap = {
        confirmed: 'Assigned',
        in_transit: 'In Transit',
        completed: 'Completed',
        cancelled: 'Cancelled',
      };
      setRows((prev) => prev.map((item) => (
        item.id === pickup.id ? { ...item, status: labelMap[nextStatus] || item.status } : item
      )));
      setOpenMenuId(null);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleFilter = (key) => {
    setOpenFilter((prev) => (prev === key ? null : key));
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setOpenFilter(null);
    setCurrentPage(1);
  };

  const firstVisible = filteredRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const lastVisible = Math.min(safePage * PAGE_SIZE, filteredRows.length);
  const session = safeSession();

  return (
    <section
      className="pickup-admin"
      onClick={() => {
        setOpenMenuId(null);
        setOpenFilter(null);
      }}
    >
      <header className="pickup-topbar">
        <div className="pickup-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search for pickups, donors or teams..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="pickup-topbar-actions">
          <button className="pickup-icon-btn" type="button" aria-label="Notifications">
            <Bell size={16} />
          </button>
          <button className="pickup-icon-btn" type="button" aria-label="Messages">
            <MessageSquare size={16} />
          </button>
        </div>
      </header>

      <div className="pickup-hero">
        <div className="pickup-hero-copy">
          <p className="pickup-kicker">Admin Logistics Desk</p>
          <h1 className="pickup-title">Pickups Management</h1>
          <p className="pickup-subtitle">
            Live overview of material collection and distribution requests for {session?.name || 'the admin team'}.
          </p>
          <div className="pickup-hero-chips">
            <span className="pickup-hero-chip">
              <ClipboardCheck size={14} />
              {pickupSummary.pending} awaiting dispatch
            </span>
            <span className="pickup-hero-chip is-info">
              <Truck size={14} />
              {pickupSummary.mapped} mapped pickups
            </span>
            <span className="pickup-hero-chip is-neutral">
              <PackageCheck size={14} />
              {pickupSummary.organizations} active organizations
            </span>
          </div>
          <div className="pickup-hero-actions">
            <button className="pickup-primary-btn" type="button">
              <Plus size={16} />
              New Pickup Request
            </button>
          </div>
        </div>

        <div className="pickup-hero-panel">
          <div className="pickup-hero-panel-top">
            <span className="pickup-hero-panel-label">Delivery completion</span>
            <strong>{pickupSummary.completionRate}%</strong>
          </div>
          <div className="pickup-hero-progress" aria-hidden="true">
            <span style={{ width: `${pickupSummary.completionRate}%` }} />
          </div>
          <div className="pickup-hero-metrics">
            <div>
              <strong>{pickupSummary.total}</strong>
              <span>Total requests</span>
            </div>
            <div>
              <strong>{pickupSummary.mapped}</strong>
              <span>Geo tagged</span>
            </div>
            <div>
              <strong>{pickupSummary.organizations}</strong>
              <span>Partner orgs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pickup-stats">
        {stats.map((stat) => (
          <div key={stat.label} className={`pickup-stat-card pickup-tone-${stat.tone}`}>
            <div className="pickup-stat-top">
              <p className="pickup-stat-label">{stat.label}</p>
              <span className="pickup-stat-icon">
                <stat.icon size={18} />
              </span>
            </div>
            <div className="pickup-stat-bottom">
              <p className="pickup-stat-value">{loading ? '-' : stat.value}</p>
              <span className="pickup-stat-change">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pickup-table-card">
        <div className="pickup-filters">
          <div className="pickup-filter-group">
            <div className="pickup-filter">
              <button
                className="pickup-filter-btn"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFilter('status');
                }}
              >
                Status: {filters.status}
                <ChevronDown size={16} />
              </button>
              {openFilter === 'status' ? (
                <div className="pickup-filter-menu" onClick={(event) => event.stopPropagation()}>
                  {['All', 'Pending', 'Assigned', 'In Transit', 'Completed'].map((value) => (
                    <button key={value} type="button" onClick={() => updateFilter('status', value)}>
                      {value}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="pickup-filter">
              <button
                className="pickup-filter-btn"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFilter('date');
                }}
              >
                Date: {filters.date}
                <ChevronDown size={16} />
              </button>
              {openFilter === 'date' ? (
                <div className="pickup-filter-menu" onClick={(event) => event.stopPropagation()}>
                  {['Today', 'This Week', 'This Month', 'Last 30 Days', 'All Time'].map((value) => (
                    <button key={value} type="button" onClick={() => updateFilter('date', value)}>
                      {value}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="pickup-filter">
              <button
                className="pickup-filter-btn"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFilter('province');
                }}
              >
                Province: {filters.province}
                <ChevronDown size={16} />
              </button>
              {openFilter === 'province' ? (
                <div className="pickup-filter-menu" onClick={(event) => event.stopPropagation()}>
                  {provinceOptions.map((value) => (
                    <button key={value} type="button" onClick={() => updateFilter('province', value)}>
                      {value}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <button className="pickup-filter-ghost" type="button">
            <Filter size={16} />
            {filteredRows.length} Visible Rows
          </button>
        </div>

        <div className="pickup-table-wrap">
          <table className="pickup-table">
            <thead>
              <tr>
                <th>Donor Name</th>
                <th>Organization</th>
                <th>Item Category</th>
                <th>Pickup Date</th>
                <th>Status</th>
                <th className="pickup-text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="pickup-table-empty">Loading live pickup records...</td>
                </tr>
              ) : null}
              {!loading && error ? (
                <tr>
                  <td colSpan="6" className="pickup-table-empty pickup-table-error">{error}</td>
                </tr>
              ) : null}
              {!loading && !error && pagedRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="pickup-table-empty">No pickup requests matched the current filters.</td>
                </tr>
              ) : null}
              {!loading && !error
                ? pagedRows.map((pickup) => (
                  <tr key={pickup.id}>
                    <td>
                      <div className="pickup-name">
                        <div className="pickup-avatar">{pickup.initials}</div>
                        <span>{pickup.name}</span>
                      </div>
                    </td>
                    <td>{pickup.org}</td>
                    <td>
                      <span className={`pickup-tag ${categoryClasses[pickup.category] || categoryClasses.Other}`}>
                        {pickup.category}
                      </span>
                    </td>
                    <td>{pickup.date}</td>
                    <td>
                      <span className={`pickup-status ${statusClasses[pickup.status]}`}>
                        <span className="pickup-status-dot" />
                        {pickup.status}
                      </span>
                    </td>
                    <td className="pickup-text-right">
                      {pickup.status === 'Pending' ? (
                        <button className="pickup-assign-btn" type="button" onClick={() => handleStatusUpdate(pickup, 'confirmed')} disabled={updatingId === pickup.id}>
                          <UserPlus size={14} />
                          {updatingId === pickup.id ? 'Updating...' : 'Assign Team'}
                        </button>
                      ) : (
                        <div className="pickup-actions">
                          <button
                            className="pickup-icon-ghost"
                            type="button"
                            aria-label="More actions"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleMenu(pickup.id);
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === pickup.id ? (
                            <div className="pickup-menu" role="menu" onClick={(event) => event.stopPropagation()}>
                              <button type="button" role="menuitem" onClick={() => handleStatusUpdate(pickup, 'confirmed')}>Mark Assigned</button>
                              <button type="button" role="menuitem" onClick={() => handleStatusUpdate(pickup, 'in_transit')}>Mark In Transit</button>
                              <button type="button" role="menuitem" onClick={() => handleStatusUpdate(pickup, 'completed')}>Mark Completed</button>
                              <button type="button" role="menuitem" className="danger" onClick={() => handleStatusUpdate(pickup, 'cancelled')}>Cancel Pickup</button>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="pickup-table-footer">
          <p>
            Showing <strong>{firstVisible}</strong> to <strong>{lastVisible}</strong> of <strong>{filteredRows.length}</strong> results
          </p>
          <div className="pickup-pagination">
            <button type="button" disabled={safePage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
              Previous
            </button>
            <button type="button" disabled={safePage === totalPages || filteredRows.length === 0} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="pickup-bottom-grid">
        <div className="pickup-panel pickup-map-panel">
          <div className="pickup-panel-header">
            <h2>Active Collection Map</h2>
            <button className="pickup-link" type="button">
              {mapMarkers.length} mapped pickups
            </button>
          </div>
          <div className="pickup-map">
            <MapContainer center={mapCenter} zoom={11} scrollWheelZoom={false}>
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapMarkers.map((marker) => (
                <Marker key={marker.id} position={[marker.lat, marker.lng]}>
                  <Popup>
                    <strong>{marker.name}</strong>
                    <br />
                    {marker.org}
                    <br />
                    Status: {marker.status}
                  </Popup>
                </Marker>
              ))}
              {location ? (
                <Marker position={[location.latitude, location.longitude]}>
                  <Popup>
                    <strong>Current Location</strong>
                    <br />
                    Lat: {location.latitude.toFixed(5)}, Lng: {location.longitude.toFixed(5)}
                  </Popup>
                </Marker>
              ) : null}
            </MapContainer>
          </div>
          <div className="pickup-map-footer">
            <div>
              <p className="pickup-map-title">Get Current Latitude and Longitude</p>
              <button className="pickup-secondary-btn" type="button" onClick={getCurrentLocation}>
                Get Location
              </button>
              {location ? (
                <div className="pickup-map-coords">
                  <span>Lat: {location.latitude.toFixed(5)}</span>
                  <span>Lng: {location.longitude.toFixed(5)}</span>
                </div>
              ) : null}
              {locationError ? <p className="pickup-map-error">{locationError}</p> : null}
            </div>
            <div className="pickup-map-legend">
              <span className="pickup-legend-dot pickup-legend-dot-primary" />
              <span>Pickups</span>
              <span className="pickup-legend-dot pickup-legend-dot-current" />
              <span>Current</span>
            </div>
          </div>
        </div>

        <div className="pickup-panel pickup-team-panel">
          <div className="pickup-panel-header">
            <h2>Organization Activity</h2>
          </div>
          <div className="pickup-team-list">
            {organizationActivity.length === 0 ? <p className="pickup-panel-empty">No organization activity yet.</p> : null}
            {organizationActivity.map((team) => (
              <div className="pickup-team" key={team.team}>
                <div className="pickup-team-row">
                  <span>{team.team}</span>
                  <span>{team.count} pickups</span>
                </div>
                <div className="pickup-team-bar">
                  <span style={{ width: `${team.percent}%` }} />
                </div>
              </div>
            ))}
            <button className="pickup-secondary-btn" type="button">
              View Organizations
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
