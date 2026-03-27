import { Send } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('chomnuoy_session');
      const session = raw ? JSON.parse(raw) : null;
      if (!session) return;
      setForm((prev) => ({
        ...prev,
        name: session?.name || prev.name,
        email: session?.email || prev.email,
      }));
    } catch {
      // ignore session read errors
    }
  }, []);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setStatus({ type: 'error', message: 'Please fill in all fields before sending.' });
      return;
    }

    let userId = 0;
    try {
      const raw = window.localStorage.getItem('chomnuoy_session');
      const session = raw ? JSON.parse(raw) : null;
      userId = Number(session?.userId ?? 0);
    } catch {
      userId = 0;
    }

    setIsSubmitting(true);
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const payload = {
      user_id: Number.isFinite(userId) ? userId : 0,
      sender_type: 'user',
      sender_name: form.name.trim(),
      sender_email: form.email.trim(),
      recipient_type: 'admin',
      message: `From: ${form.name.trim()} <${form.email.trim()}>\nSubject: ${form.subject.trim()}\nMessage: ${form.message.trim()}`,
      type: 'message',
      is_read: false,
    };

    try {
      const response = await fetch(`${apiBase}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to send message (${response.status})`);
      }
      setStatus({ type: 'success', message: 'Message sent. Our team will reply soon.' });
      setForm((prev) => ({ ...prev, subject: '', message: '' }));
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to send message.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-form-card">
      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="contact-form-row">
          <label>
            <span>Full Name</span>
            <input 
              className="contact-input"
              placeholder="Jane Doe" 
              type="text" 
              value={form.name}
              onChange={handleChange('name')}
            />
          </label>
          <label>
            <span>Email Address</span>
            <input 
              className="contact-input"
              placeholder="jane@example.com" 
              type="email" 
              value={form.email}
              onChange={handleChange('email')}
            />
          </label>
        </div>
        <label>
          <span>Subject</span>
          <input 
            className="contact-input"
            placeholder="How can we help you?" 
            type="text" 
            value={form.subject}
            onChange={handleChange('subject')}
          />
        </label>
        <label>
          <span>Message</span>
          <textarea 
            className="contact-textarea"
            placeholder="Write your message here..." 
            rows={7}
            value={form.message}
            onChange={handleChange('message')}
          ></textarea>
        </label>
        <button 
          className="contact-submit-btn"
          type="submit"
          disabled={isSubmitting}
        >
          <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
          <Send className="size-4" />
        </button>

        {status.message ? (
          <div className={`contact-form-status ${status.type}`}>
            {status.message}
          </div>
        ) : null}

        <div className="contact-form-note">
          <h4>What happens next?</h4>
          <p>
            Our team reviews your message and replies within 24-48 hours. For urgent help, call
            <strong> +1 (555) 000-0000</strong>.
          </p>
        </div>
      </form>
    </div>
  );
}
