import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus2, CircleCheckBig, Package, Search, EllipsisVertical, Info, MapPinned, ChevronLeft, ChevronRight, Eye, CalendarDays, XCircle } from 'lucide-react';
import './material-pickup.css';

const PAGE_SIZE = 6;

export default function MaterialPickupPage() {
  const navigate = useNavigate();
  const [pickupRows, setPickupRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  const normalizeStatus = (value) => {
    const status = String(value || '').toLowerCase();
    if (['delivered', 'completed', 'complete'].includes(status)) {
      return { label: 'Delivered', tone: 'delivered' };
    }
    if (['in transit', 'transit', 'in_transit', 'enroute', 'en route'].includes(status)) {
      return { label: 'In Transit', tone: 'transit' };
    }
    return { label: 'Pending', tone: 'pending' };
  };

  const formatTimeRange = (fromValue, toValue, fallback) => {
    if (fromValue || toValue) {
      const fromLabel = fromValue || '';
      const toLabel = toValue ? ` - ${toValue}` : '';
      return `${fromLabel}${toLabel}`.trim();
    }
    return fallback || 'Pending confirmation';
  };

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

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let alive = true;
    setLoading(true);
    setError('');

    fetch(`${apiBase}/material_pickups`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load pickups (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((item) => {
          const status = normalizeStatus(item.status);
          const dateValue = item.pickup_date || item.date || item.created_at || '';
          return {
            id: item.id ?? `${item.organization_name || item.org || 'org'}-${dateValue}`,
            date: formatDateLabel(dateValue),
            time: formatTimeRange(item.time_from || item.timeFrom, item.time_to || item.timeTo, item.time),
            org: item.organization_name || item.organization || item.org || 'Unknown Organization',
            items: item.items || item.item_name || item.item || 'Material items',
            detail: item.detail || item.notes || item.description || 'No additional details',
            address: item.address || item.pickup_address || item.location || 'Pickup address not provided',
            status: status.label,
            statusTone: status.tone,
            createdAt: new Date(dateValue || Date.now()).getTime(),
            quantity: Number(item.quantity || item.item_count || item.items_count || item.total_items || 1),
          };
        });
        setPickupRows(mapped);
        setCurrentPage(1);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load pickups.');
        setPickupRows([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const handleOpenSchedulePopup = () => {
    setIsScheduleOpen(true);
  };

  const handleCloseSchedulePopup = () => {
    setIsScheduleOpen(false);
  };

  const handleScheduleSubmit = (event) => {
    event.preventDefault();

    const status = normalizeStatus('pending');
    const nextRow = {
      date: formatDateLabel(newPickupForm.date),
      time: `${newPickupForm.timeFrom} - ${newPickupForm.timeTo}`,
      org: newPickupForm.organization,
      items: newPickupForm.items,
      detail: newPickupForm.detail || 'No additional details',
      address: newPickupForm.address,
      status: status.label,
      statusTone: status.tone,
      id: `local-${Date.now()}`,
      createdAt: new Date(newPickupForm.date || Date.now()).getTime(),
      quantity: 1,
    };

    setPickupRows((prev) => [nextRow, ...prev]);
    setCurrentPage(1);
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

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return pickupRows;

    return pickupRows.filter((row) => {
      const haystack = [
        row.date,
        row.time,
        row.org,
        row.items,
        row.detail,
        row.address,
        row.status,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [pickupRows, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const pagedRows = filteredRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const summaryCards = useMemo(() => {
    const scheduled = pickupRows.filter((row) => row.statusTone === 'pending').length;
    const delivered = pickupRows.filter((row) => row.statusTone === 'delivered').length;
    const totalItems = pickupRows.reduce((sum, row) => sum + (row.quantity || 1), 0);

    return [
      { title: 'Scheduled Pickups', value: scheduled, icon: <CalendarPlus2 />, tone: 'amber' },
      { title: 'Completed Deliveries', value: delivered, icon: <CircleCheckBig />, tone: 'green' },
      { title: 'Total Items Donated', value: totalItems, icon: <Package />, tone: 'blue' },
    ];
  }, [pickupRows]);

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
          {summaryCards.map((card) => (
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
              <input
                type="search"
                placeholder="Search pickups..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
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

          {loading ? (
            <div className="mp-table-body">
              <article className="mp-row">
                <div>Loading pickups...</div>
              </article>
            </div>
          ) : null}

          {error ? (
            <div className="mp-table-body">
              <article className="mp-row">
                <div>{error}</div>
              </article>
            </div>
          ) : null}

          {!loading && !error ? (
            <div className="mp-table-body">
              {pagedRows.length === 0 ? (
                <article className="mp-row">
                  <div>No pickups match your search.</div>
                </article>
              ) : (
                pagedRows.map((row) => {
                  const rowKey = row.id ?? `${row.org}-${row.date}`;
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
                                setPickupRows((prev) =>
                                  prev.filter(
                                    (item) => (item.id ?? `${item.org}-${item.date}`) !== rowKey,
                                  ),
                                );
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
                  );
                })
              )}
            </div>
          ) : null}

          <footer className="mp-table-foot">
            <p>Showing {filteredRows.length} material donations</p>
            <div className="mp-pagination">
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
              >
                <ChevronLeft />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={page === safePage ? 'active' : ''}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next page"
                onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
                disabled={safePage === pageCount}
              >
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
    </main>
  );
}
