import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import './pickup-detail.css';

export default function PickupReschedulePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pickup = location.state?.pickup;

  const [form, setForm] = useState({
    date: pickup?.date || '',
    timeFrom: '',
    timeTo: '',
    address: pickup?.address || '',
    note: '',
  });

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

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/pickup');
  };

  return (
    <main className="pd-page">
      <section className="pd-shell">
        <button type="button" className="pd-back" onClick={() => navigate('/pickup')}>
          <ArrowLeft />
          Back to Material Pickup
        </button>

        <article className="pd-card">
          <header className="pd-head">
            <h1>Reschedule Pickup</h1>
            <span className="pd-status pending">Pending</span>
          </header>

          <form className="pr-form" onSubmit={handleSubmit}>
            <label>
              New Date
              <input
                type="text"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                placeholder="Oct 30, 2023"
                required
              />
            </label>
            <label>
              New Time From
              <input
                type="text"
                value={form.timeFrom}
                onChange={(e) => setForm({ ...form, timeFrom: e.target.value })}
                placeholder="10:00 AM"
                required
              />
            </label>
            <label>
              New Time To
              <input
                type="text"
                value={form.timeTo}
                onChange={(e) => setForm({ ...form, timeTo: e.target.value })}
                placeholder="12:00 PM"
                required
              />
            </label>
            <label className="full">
              Address
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </label>
            <label className="full">
              Note
              <textarea
                rows={4}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Optional note for delivery team..."
              />
            </label>

            <div className="pr-actions">
              <button type="button" className="cancel" onClick={() => navigate('/pickup')}>Cancel</button>
              <button type="submit" className="submit">
                <CalendarDays />
                Save Reschedule
              </button>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
}
