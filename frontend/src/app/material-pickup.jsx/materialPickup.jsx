import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus2, CircleCheckBig, Package, Search, EllipsisVertical, Info, MapPinned, ChevronLeft, ChevronRight, Eye, CalendarDays, XCircle } from 'lucide-react';
import { buildMaterialWorkflowRows, getMaterialWorkflowResources, updateMaterialWorkflowStatus } from '@/services/material-workflow-service.js';
import './material-pickup.css';

const PAGE_SIZE = 6;
const PICKUP_CACHE_KEY_PREFIX = 'donor_material_pickups_v2';
const PICKUP_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

function getDonorSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function getPickupCacheKey(donorId) {
  return `${PICKUP_CACHE_KEY_PREFIX}:${donorId || 'guest'}`;
}

function readPickupCache(donorId) {
  try {
    const raw = window.sessionStorage.getItem(getPickupCacheKey(donorId));
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed?.timestamp) return null;
    if (Date.now() - parsed.timestamp > PICKUP_CACHE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(getPickupCacheKey(donorId));
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function writePickupCache(donorId, data) {
  try {
    window.sessionStorage.setItem(
      getPickupCacheKey(donorId),
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore cache write failures.
  }
}

export default function MaterialPickupPage() {
  const navigate = useNavigate();
  const donorSession = getDonorSession();
  const donorId = Number(donorSession?.userId || donorSession?.id || 0);
  const cachedRows = useMemo(() => readPickupCache(donorId), [donorId]);
  const [pickupRows, setPickupRows] = useState(Array.isArray(cachedRows) ? cachedRows : []);
  const [loading, setLoading] = useState(!Array.isArray(cachedRows));
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

  useEffect(() => {
    const handleCloseMenu = () => setOpenMenuKey(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  useEffect(() => {
    let alive = true;
    setError('');
    if (!Array.isArray(cachedRows)) {
      setLoading(true);
    }

    getMaterialWorkflowResources()
      .then((resources) => {
        if (!alive) return;
        const mapped = buildMaterialWorkflowRows(resources)
          .filter((row) => !donorId || Number(row.donorUserId) === donorId)
          .map((row) => ({
            id: row.pickupId || row.id,
            date: row.scheduleDateLabel,
            time: row.scheduleTimeLabel,
            org: row.organizationName,
            donor: row.donorName,
            donorInitials: row.donorInitials || getInitials(row.donorName, 'DN'),
            items: row.itemName,
            detail: row.itemSummary,
            address: row.pickupAddress,
            status: row.donorStatusLabel,
            statusTone: row.donorStatusTone,
            createdAt: row.createdAtValue,
            quantity: row.quantity,
            donationId: row.donationId,
            pickupId: row.pickupId,
            campaignId: row.campaignId,
            scheduleDateRaw: row.scheduleDateRaw,
            timeline: row.timeline,
          }));

        setPickupRows(mapped);
        writePickupCache(donorId, mapped);
        setCurrentPage(1);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load pickups.');
        if (!Array.isArray(cachedRows)) {
          setPickupRows([]);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [cachedRows, donorId]);

  const handleOpenSchedulePopup = () => {
    setIsScheduleOpen(true);
  };

  const handleCloseSchedulePopup = () => {
    setIsScheduleOpen(false);
  };

  const handleScheduleSubmit = (event) => {
    event.preventDefault();

    const nextRow = {
      date: newPickupForm.date,
      time: `${newPickupForm.timeFrom} - ${newPickupForm.timeTo}`,
      org: newPickupForm.organization,
      items: newPickupForm.items,
      detail: newPickupForm.detail || 'No additional details',
      address: newPickupForm.address,
      status: 'Pending',
      statusTone: 'pending',
      id: `local-${Date.now()}`,
      createdAt: new Date(newPickupForm.date || Date.now()).getTime(),
      quantity: 1,
    };

    setPickupRows((prev) => {
      const nextRows = [nextRow, ...prev];
      writePickupCache(donorId, nextRows);
      return nextRows;
    });
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
                pagedRows.map((row, index) => {
                  const rowKey = row.id ?? `${row.org}-${row.date}`;
                  const isMenuOpen = openMenuKey === rowKey;
                  const shouldOpenUpward = index >= pagedRows.length - 2;

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
                          <div
                            className={`mp-action-menu${shouldOpenUpward ? ' up' : ''}`}
                            role="menu"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                              onClick={async () => {
                                if (row.pickupId && row.donationId) {
                                  await updateMaterialWorkflowStatus({
                                    pickupId: row.pickupId,
                                    donationId: row.donationId,
                                    pickupPatch: {
                                      status: 'cancelled',
                                      pickup_address: row.address,
                                      schedule_date: row.scheduleDateRaw,
                                    },
                                    donationStatus: 'cancelled',
                                  }).catch(() => null);
                                }
                                setPickupRows((prev) => {
                                  const nextRows = prev.filter(
                                    (item) => (item.id ?? `${item.org}-${item.date}`) !== rowKey,
                                  );
                                  writePickupCache(donorId, nextRows);
                                  return nextRows;
                                });
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
            <p>Showing {filteredRows.length} pickup request{filteredRows.length === 1 ? '' : 's'}</p>
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
