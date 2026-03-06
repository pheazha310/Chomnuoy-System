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

  useEffect(() => {
    const handleCloseMenu = () => setOpenMenuKey(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  return (
    <main className="mp-page">
      <section className="mp-shell">
        <header className="mp-head">
          <div>
            <h1 style={{fontWeight:'bold'}}>Material Pickup & Delivery</h1>
            <p>Track your material donations and coordinate with our delivery teams.</p>
          </div>
          <button type="button" className="mp-new-btn">
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
    </main>
  );
}
