import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import apiClient from '@/services/api-client.js';
import { parseDate } from '@/services/material-workflow-service.js';
import './pickup-detail.css';

export default function PickupReschedulePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pickup = location.state?.pickup;
  const scheduledDate = parseDate(pickup?.scheduleDateRaw || pickup?.date);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    date: scheduledDate
      ? `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, '0')}-${String(scheduledDate.getDate()).padStart(2, '0')}`
      : '',
    timeFrom: scheduledDate
      ? `${String(scheduledDate.getHours()).padStart(2, '0')}:${String(scheduledDate.getMinutes()).padStart(2, '0')}`
      : '',
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!pickup?.pickupId) {
      navigate('/pickup');
      return;
    }

    setSaving(true);
    try {
      const [hours = '09', minutes = '00'] = String(form.timeFrom || '09:00').split(':');
      const scheduleDate = new Date(`${form.date}T${hours}:${minutes}:00`);
      await apiClient.put(`/material_pickups/${pickup.pickupId}`, {
        status: 'pending',
        pickup_address: form.address,
        schedule_date: scheduleDate.toISOString(),
        notes: form.note || pickup?.detail || '',
      });
      navigate('/pickup');
    } finally {
      setSaving(false);
    }
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
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </label>
            <label>
              New Time From
              <input
                type="time"
                value={form.timeFrom}
                onChange={(e) => setForm({ ...form, timeFrom: e.target.value })}
                required
              />
            </label>
            <label>
              New Time To
              <input
                type="time"
                value={form.timeTo}
                onChange={(e) => setForm({ ...form, timeTo: e.target.value })}
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
              <button type="submit" className="submit" disabled={saving}>
                <CalendarDays />
                {saving ? 'Saving...' : 'Save Reschedule'}
              </button>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
}
