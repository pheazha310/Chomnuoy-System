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
              <li className="done">Pickup requested</li>
              <li className="done">Driver assigned</li>
              <li className={pickup.status === 'Delivered' ? 'done' : ''}>In transit</li>
              <li className={pickup.status === 'Delivered' ? 'done' : ''}>Delivered</li>
            </ul>
          </div>
        </article>
      </section>
    </main>
  );
}
