import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus2, CircleCheckBig, Package, Search, EllipsisVertical, Info, MapPinned, ChevronLeft, ChevronRight, Eye, CalendarDays, XCircle } from 'lucide-react';
import './material-pickup.css';

const summary = [
  { title: 'Scheduled Pickups', value: 3, icon: <CalendarPlus2 />, tone: 'amber' },
  { title: 'Completed Deliveries', value: 12, icon: <CircleCheckBig />, tone: 'green' },
  { title: 'Total Items Donated', value: 48, icon: <Package />, tone: 'blue' },
];

const rows = [
  {
    date: 'Oct 24, 2023',
    time: '10:00 AM - 12:00 PM',
    org: "Children's Hope Foundation",
    items: 'Clothing & Textbooks',
    detail: '3 boxes total',
    address: '#123 Street 45, Phnom Penh',
    status: 'Pending',
    statusTone: 'pending',
  },
  {
    date: 'Oct 22, 2023',
    time: '02:00 PM - 04:00 PM',
    org: 'Eco-Green Cambodia',
    items: 'Electronics for Recycling',
    detail: '1 large monitor, 2 laptops',
    address: '#123 Street 45, Phnom Penh',
    status: 'In Transit',
    statusTone: 'transit',
  },
  {
    date: 'Oct 18, 2023',
    time: 'Completed 11:30 AM',
    org: 'Health First Foundation',
    items: 'First Aid Kits',
    detail: '10 sealed kits',
    address: '#123 Street 45, Phnom Penh',
    status: 'Delivered',
    statusTone: 'delivered',
  },
];

export default function MaterialPickupPage() {
  const navigate = useNavigate();
  const [pickupRows, setPickupRows] = useState(rows);
  const [openMenuKey, setOpenMenuKey] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [newPickupForm, setNewPickupForm] = useState({
    date: '',
    timeFrom: '',
    timeTo: '',
    organization: '',
    items: '',
    detail: '',
    address: '',
  });

  const formatDateLabel = (rawDate) => {
    if (!rawDate) return '';
    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime())
      ? rawDate
      : parsedDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  useEffect(() => {
    const handleCloseMenu = () => setOpenMenuKey(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const handleOpenSchedulePopup = () => {
    setIsScheduleOpen(true);
  };

  const handleCloseSchedulePopup = () => {
    setIsScheduleOpen(false);
  };

  const handleScheduleSubmit = (event) => {
    event.preventDefault();

    const nextRow = {
      date: formatDateLabel(newPickupForm.date),
      time: `${newPickupForm.timeFrom} - ${newPickupForm.timeTo}`,
      org: newPickupForm.organization,
      items: newPickupForm.items,
      detail: newPickupForm.detail || 'No additional details',
      address: newPickupForm.address,
      status: 'Pending',
      statusTone: 'pending',
    };

    setPickupRows((prev) => [nextRow, ...prev]);
    setNewPickupForm({
      date: '',
      timeFrom: '',
      timeTo: '',
      organization: '',
      items: '',
      detail: '',
      address: '',
    });
    setIsScheduleOpen(false);
  };

  return (
    <main className="mp-page">
      <section className="mp-shell">
        <header className="mp-head">
          <div>
            <h1 style={{fontWeight:'bold'}}>Material Pickup & Delivery</h1>
            <p>Track your material donations and coordinate with our delivery teams.</p>
          </div>
          <button type="button" className="mp-new-btn" onClick={handleOpenSchedulePopup}>
            <CalendarPlus2 />
            Schedule New Pickup
          </button>
        </header>

        <section className="mp-summary-grid" aria-label="Pickup summary">
          {summary.map((card) => (
            <article key={card.title} className="mp-summary-card">
              <span className={`mp-summary-icon ${card.tone}`}>{card.icon}</span>
              <div>
                <p>{card.title}</p>
                <strong>{card.value}</strong>
              </div>
            </article>
          ))}
        </section>

        <section className="mp-table-wrap">
          <div className="mp-table-top">
            <h2>Active & Recent Pickups</h2>
            <label className="mp-search">
              <Search />
              <input type="search" placeholder="Search pickups..." />
            </label>
          </div>

          <div className="mp-table-head">
            <span>Date & Time</span>
            <span>Organization</span>
            <span>Items</span>
            <span>Address</span>
            <span>Status</span>
            <span />
          </div>

          <div className="mp-table-body">
            {pickupRows.map((row) => {
              const rowKey = `${row.org}-${row.date}`;
              const isMenuOpen = openMenuKey === rowKey;

              return (
              <article key={rowKey} className="mp-row">
                <div>
                  <strong>{row.date}</strong>
                  <p>{row.time}</p>
                </div>
                <div>
                  <strong>{row.org}</strong>
                </div>
                <div>
                  <strong>{row.items}</strong>
                  <p>{row.detail}</p>
                </div>
                <div>{row.address}</div>
                <div>
                  <span className={`mp-status ${row.statusTone}`}>{row.status}</span>
                </div>
                <div className="mp-more-wrap">
                  <button
                    type="button"
                    className="mp-more-btn"
                    aria-label="More options"
                    aria-expanded={isMenuOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuKey((prev) => (prev === rowKey ? null : rowKey));
                    }}
                  >
                    <EllipsisVertical />
                  </button>

                  {isMenuOpen && (
                    <div className="mp-action-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuKey(null);
                          navigate('/pickup/view-detail', { state: { pickup: row } });
                        }}
                      >
                        <Eye />
                        View Details
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuKey(null);
                          navigate('/pickup/reschedule', { state: { pickup: row } });
                        }}
                      >
                        <CalendarDays />
                        Reschedule Pickup
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="danger"
                        onClick={() => {
                          setPickupRows((prev) => prev.filter((item) => `${item.org}-${item.date}` !== rowKey));
                          setOpenMenuKey(null);
                        }}
                      >
                        <XCircle />
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )})}
          </div>

          <footer className="mp-table-foot">
            <p>Showing {pickupRows.length} material donations</p>
            <div className="mp-pagination">
              <button type="button" aria-label="Previous page">
                <ChevronLeft />
              </button>
              <button type="button" className="active">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button" aria-label="Next page">
                <ChevronRight />
              </button>
            </div>
          </footer>
        </section>

        <section className="mp-info-grid" aria-label="Pickup help information">
          <article className="mp-info-card">
            <span className="mp-info-icon">
              <Info />
            </span>
            <div>
              <h3>How it works</h3>
              <p>
                Schedule a pickup and our team will arrive at your address within the chosen time slot.
                Please ensure items are boxed or bagged and ready for transport.
              </p>
            </div>
          </article>
          <article className="mp-info-card">
            <span className="mp-info-icon muted">
              <MapPinned />
            </span>
            <div>
              <h3>Track Delivery</h3>
              <p>
                Once picked up, you can track the real-time location of your donation as it makes its way
                to the organization. Notifications will be sent at each stage.
              </p>
            </div>
          </article>
        </section>
      </section>

      {isScheduleOpen && (
        <div className="mp-modal-overlay" onClick={handleCloseSchedulePopup}>
          <div className="mp-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>Schedule New Pickup</h2>
            <p>Fill in the details and save your pickup request.</p>

            <form className="mp-modal-form" onSubmit={handleScheduleSubmit}>
              <label>
                Pickup Date
                <input
                  type="date"
                  value={newPickupForm.date}
                  onChange={(event) => setNewPickupForm((prev) => ({ ...prev, date: event.target.value }))}
                  required
                />
              </label>
              <label>
                Time From
                <input
                  type="time"
                  value={newPickupForm.timeFrom}
                  onChange={(event) => setNewPickupForm((prev) => ({ ...prev, timeFrom: event.target.value }))}
                  required
                />
              </label>
              <label>
                Time To
                <input
                  type="time"
                  value={newPickupForm.timeTo}
                  onChange={(event) => setNewPickupForm((prev) => ({ ...prev, timeTo: event.target.value }))}
                  required
                />
              </label>
              <label>
                Organization
                <input
                  type="text"
                  value={newPickupForm.organization}
                  onChange={(event) => setNewPickupForm((prev) => ({ ...prev, organization: event.target.value }))}
                  placeholder="Organization name"
                  required
                />
              </label>
              <label className="full">
                Items
                <input
                  type="text"
                  value={newPickupForm.items}
                  onChange={(event) => setNewPickupForm((prev) => ({ ...prev, items: event.target.value }))}
                  placeholder="Items for pickup"
                  required
                />
              </label>
              <label className="full">
                Detail
                <input
                  type="text"
                  value={newPickupForm.detail}
                  onChange={(event) => setNewPickupForm((prev) => ({ ...prev, detail: event.target.value }))}
                  placeholder="e.g. 3 boxes total"
                />
              </label>
              <label className="full">
                Address
                <input
                  type="text"
                  value={newPickupForm.address}
                  onChange={(event) => setNewPickupForm((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="Pickup address"
                  required
                />
              </label>

              <div className="mp-modal-actions">
                <button type="button" className="cancel" onClick={handleCloseSchedulePopup}>Cancel</button>
                <button type="submit" className="submit">Save Pickup</button>
              </div>
            </form>
          </div>
        </div>
      )}
q    </main>
  );
}
