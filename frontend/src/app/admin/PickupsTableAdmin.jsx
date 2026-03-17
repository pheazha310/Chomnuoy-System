import React from 'react';
import {
  Bell,
  ChevronDown,
  Filter,
  MapPin,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  UserPlus,
} from 'lucide-react';
import './PickupsTableAdmin.css';

const pickups = [
  { id: 1, initials: 'SK', name: 'Sovanndara Keo', org: 'Cambodia Hope Org.', category: 'Clothing', date: 'Oct 12, 2023', status: 'Pending', statusColor: 'orange', lat: 11.5564, lng: 104.9282 },
  { id: 2, initials: 'VL', name: 'Vannak Leakhena', org: 'Future Scholars Foundation', category: 'Education', date: 'Oct 11, 2023', status: 'Assigned', statusColor: 'blue', lat: 13.3671, lng: 103.8448 },
  { id: 3, initials: 'CH', name: 'Chann Her', org: 'Sunrise Village', category: 'Food Supply', date: 'Oct 10, 2023', status: 'In Transit', statusColor: 'indigo', lat: 10.6167, lng: 103.5167 },
  { id: 4, initials: 'BP', name: 'Bopha Phala', org: 'Green Cambodia', category: 'Household', date: 'Oct 09, 2023', status: 'Completed', statusColor: 'emerald', lat: 12.0000, lng: 105.4800 },
  { id: 5, initials: 'NS', name: 'Nareth Sinat', org: 'Krousar Thmey', category: 'Clothing', date: 'Oct 08, 2023', status: 'Pending', statusColor: 'orange', lat: 12.2480, lng: 104.6680 },
];

const stats = [
  { label: 'Pending Pickups', value: '24', change: '+5%', tone: 'warning' },
  { label: 'In Transit', value: '12', change: '-2%', tone: 'info' },
  { label: 'Successfully Delivered', value: '856', change: '+12%', tone: 'success' },
  { label: 'Total Items Collected', value: '3,420', change: '+8%', tone: 'success' },
];

const teamPerformance = [
  { team: 'Phnom Penh Alpha', percent: 92 },
  { team: 'Siem Reap Support', percent: 78 },
  { team: 'Coastal Response', percent: 64 },
];

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
};

const MAP_BOUNDS = {
  north: 14.7,
  south: 10.3,
  west: 102.3,
  east: 107.7,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function projectLatLng(lat, lng) {
  const x = (lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west);
  const y = (MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south);
  return {
    left: `${clamp(x, 0, 1) * 100}%`,
    top: `${clamp(y, 0, 1) * 100}%`,
  };
}

export default function PickupsTable() {
  const mapMarkers = pickups
    .filter((pickup) => Number.isFinite(pickup.lat) && Number.isFinite(pickup.lng))
    .map((pickup) => ({
      id: pickup.id,
      name: pickup.name,
      status: pickup.status,
      ...projectLatLng(pickup.lat, pickup.lng),
    }));

  return (
    <section className="pickup-admin">
      <header className="pickup-topbar">
        <div className="pickup-search">
          <Search size={16} />
          <input type="text" placeholder="Search for pickups, donors or teams..." />
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
          <h1 className="pickup-title">Overview of all material collection and distribution requests</h1>
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
              <div className="pickup-stat-icon" />
              <span className="pickup-stat-change">{stat.change}</span>
            </div>
            <p className="pickup-stat-label">{stat.label}</p>
            <p className="pickup-stat-value">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="pickup-table-card">
        <div className="pickup-filters">
          <div className="pickup-filter-group">
            {['Status: All', 'Date: This Week', 'Province: All'].map((filter) => (
              <button className="pickup-filter-btn" key={filter} type="button">
                {filter}
                <ChevronDown size={16} />
              </button>
            ))}
          </div>
          <button className="pickup-filter-ghost" type="button">
            <Filter size={16} />
            More Filters
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
              {pickups.map((pickup) => (
                <tr key={pickup.id}>
                  <td>
                    <div className="pickup-name">
                      <div className="pickup-avatar">{pickup.initials}</div>
                      <span>{pickup.name}</span>
                    </div>
                  </td>
                  <td>{pickup.org}</td>
                  <td>
                    <span className={`pickup-tag ${categoryClasses[pickup.category]}`}>
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
                      <button className="pickup-icon-ghost" type="button" aria-label="More">
                        <MoreVertical size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pickup-table-footer">
          <p>
            Showing <strong>1</strong> to <strong>5</strong> of <strong>42</strong> results
          </p>
          <div className="pickup-pagination">
            <button type="button" disabled>
              Previous
            </button>
            <button type="button">Next</button>
          </div>
        </div>
      </div>

      <div className="pickup-bottom-grid">
        <div className="pickup-panel pickup-map-panel">
          <div className="pickup-panel-header">
            <h2>Active Collection Map</h2>
            <button className="pickup-link" type="button">
              View Full Map
            </button>
          </div>
          <div className="pickup-map">
            {mapMarkers.map((marker, index) => (
              <div
                key={marker.id}
                className={`pickup-map-pin ${index === 0 ? 'pickup-pin-main' : 'pickup-pin-dot'}`}
                style={{ left: marker.left, top: marker.top }}
                title={`${marker.name} • ${marker.status}`}
              >
                {index === 0 ? <MapPin size={16} /> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="pickup-panel pickup-team-panel">
          <div className="pickup-panel-header">
            <h2>Team Performance</h2>
          </div>
          <div className="pickup-team-list">
            {teamPerformance.map((team) => (
              <div className="pickup-team" key={team.team}>
                <div className="pickup-team-row">
                  <span>{team.team}</span>
                  <span>{team.percent}%</span>
                </div>
                <div className="pickup-team-bar">
                  <span style={{ width: `${team.percent}%` }} />
                </div>
              </div>
            ))}
            <button className="pickup-secondary-btn" type="button">
              Manage Teams
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
