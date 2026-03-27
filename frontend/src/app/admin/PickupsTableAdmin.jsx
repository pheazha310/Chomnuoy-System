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
import './PickupsTableAdmin.css';

const PAGE_SIZE = 5;
const DEFAULT_CENTER = [11.5564, 104.9282];
const statusClasses = {
  Pending: 'pickup-status-pending',
  Assigned: 'pickup-status-assigned',
  'In Transit': 'pickup-status-transit',
  Completed: 'pickup-status-completed',
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

function normalizeStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  if (['assigned', 'accepted'].includes(status)) {
    return 'Assigned';
  }
  if (['in transit', 'transit', 'in_transit', 'enroute', 'en route'].includes(status)) {
    return 'In Transit';
  }
  if (['delivered', 'completed', 'complete', 'done'].includes(status)) {
    return 'Completed';
  }
  return 'Pending';
}

function normalizeCategory(value) {
  const text = String(value || '').trim().toLowerCase();
  if (text.includes('cloth')) return 'Clothing';
  if (text.includes('educ')) return 'Education';
  if (text.includes('food')) return 'Food Supply';
  if (text.includes('house')) return 'Household';
  return 'Other';
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
  const [filters, setFilters] = useState({
    status: 'All',
    date: 'This Week',
    province: 'All',
  });

  useEffect(() => {
    let active = true;
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [pickupResult, orgResult, userResult] = await Promise.allSettled([
          fetch(`${apiBase}/material_pickups`, { headers }).then((res) => {
            if (!res.ok) throw new Error(`Failed to load pickups (${res.status})`);
            return res.json();
          }),
          fetch(`${apiBase}/organizations`, { headers }).then((res) => (res.ok ? res.json() : [])),
          fetch(`${apiBase}/users`, { headers }).then((res) => (res.ok ? res.json() : [])),
        ]);

        if (!active) return;
        if (pickupResult.status !== 'fulfilled') {
          throw pickupResult.reason instanceof Error ? pickupResult.reason : new Error('Failed to load pickups.');
        }

        const organizations = orgResult.status === 'fulfilled' && Array.isArray(orgResult.value) ? orgResult.value : [];
        const users = userResult.status === 'fulfilled' && Array.isArray(userResult.value) ? userResult.value : [];
        const orgMap = new Map(organizations.map((item) => [Number(item.id), item]));
        const orgByUserMap = new Map(
          organizations
            .map((item) => [Number(item.user_id), item])
            .filter(([userId]) => Number.isFinite(userId) && userId > 0)
        );
        const userMap = new Map(users.map((item) => [Number(item.id), item]));
        const pickups = Array.isArray(pickupResult.value) ? pickupResult.value : [];

        const mapped = pickups.map((item, index) => {
          const donor =
            userMap.get(Number(item.user_id)) ||
            userMap.get(Number(item.donor_id)) ||
            null;
          const organization =
            orgMap.get(Number(item.organization_id)) ||
            orgByUserMap.get(Number(item.organization_id)) ||
            orgByUserMap.get(Number(item.org_user_id)) ||
            null;
          const donorName =
            item.donor_name ||
            item.user_name ||
            item.name ||
            donor?.name ||
            `Donor #${index + 1}`;
          const address =
            item.address ||
            item.pickup_address ||
            item.location ||
            item.destination_address ||
            '';
          const organizationName =
            item.organization_name ||
            item.organization ||
            item.org ||
            organization?.name ||
            organization?.organization_name ||
            (item.organization_id ? `Organization #${item.organization_id}` : 'Unassigned Organization');
          const rawCategory = item.category || item.item_category || item.items || item.item_name || item.item;
          const normalizedStatus = normalizeStatus(item.status);
          const pickupDateRaw = item.pickup_date || item.date || item.scheduled_at || item.created_at || '';
          const pickupDate = parseDate(pickupDateRaw);
          const latitude = Number(item.lat ?? item.latitude ?? item.pickup_latitude);
          const longitude = Number(item.lng ?? item.longitude ?? item.pickup_longitude);

          return {
            id: item.id || `pickup-${index + 1}`,
            initials: getInitials(donorName),
            name: donorName,
            org: organizationName,
            category: normalizeCategory(rawCategory),
            date: formatDateLabel(pickupDateRaw),
            pickupDate,
            status: normalizedStatus,
            province: extractProvince(item, address),
            quantity: Number(item.quantity || item.item_count || item.items_count || item.total_items || 1),
            lat: Number.isFinite(latitude) ? latitude : null,
            lng: Number.isFinite(longitude) ? longitude : null,
            address: address || 'Pickup address not provided',
          };
        });

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

      <div className="pickup-title-row">
        <div>
          <p className="pickup-kicker">Pickups Management</p>
          <h1 className="pickup-title">
            Live overview of all material collection and distribution requests for {session?.name || 'the admin team'}
          </h1>
        </div>
        <button className="pickup-primary-btn" type="button">
          <Plus size={16} />
          New Pickup Request
        </button>
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
                        <button className="pickup-assign-btn" type="button">
                          <UserPlus size={14} />
                          Assign Team
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
                              <button type="button" role="menuitem">View Details</button>
                              <button type="button" role="menuitem">Assign Team</button>
                              <button type="button" role="menuitem" className="danger">Cancel Pickup</button>
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
