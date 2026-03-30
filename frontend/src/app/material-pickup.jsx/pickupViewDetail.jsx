import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Building2, Package, MapPinned, Truck } from 'lucide-react';
import './pickup-detail.css';

export default function PickupViewDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pickup = location.state?.pickup;

  if (!pickup) {
    return (
      <main className="pd-page">
        <section className="pd-shell">
          <button type="button" className="pd-back" onClick={() => navigate('/pickup')}>
            <ArrowLeft />
            Back to Material Pickup
          </button>
          <article className="pd-card">
            <h1>Pickup Not Found</h1>
            <p>No pickup data was provided. Please return to the pickup list.</p>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="pd-page">
      <section className="pd-shell">
        <button type="button" className="pd-back" onClick={() => navigate('/pickup')}>
          <ArrowLeft />
          Back to Material Pickup
        </button>

        <article className="pd-card">
          <header className="pd-head">
            <h1>Pickup Details</h1>
            <span className={`pd-status ${pickup.statusTone}`}>{pickup.status}</span>
          </header>

          <div className="pd-grid">
            <div>
              <p><CalendarDays /> Date & Time</p>
              <strong>{pickup.date}</strong>
              <span>{pickup.time}</span>
            </div>
            <div>
              <p><Building2 /> Organization</p>
              <strong>{pickup.org}</strong>
            </div>
            <div>
              <p><Package /> Items</p>
              <strong>{pickup.items}</strong>
              <span>{pickup.detail}</span>
            </div>
            <div>
              <p><MapPinned /> Address</p>
              <strong>{pickup.address}</strong>
            </div>
          </div>

          <div className="pd-track">
            <h3><Truck /> Tracking Timeline</h3>
            <ul>
              {(Array.isArray(pickup.timeline) ? pickup.timeline : [
                { key: 'requested', label: 'Pickup requested', done: true },
                { key: 'confirmed', label: 'Driver assigned', done: true },
                { key: 'transit', label: 'In transit', done: pickup.status === 'Delivered' },
                { key: 'completed', label: 'Delivered', done: pickup.status === 'Delivered' },
              ]).map((item) => (
                <li key={item.key} className={item.done ? 'done' : ''}>{item.label}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>
    </main>
  );
}
