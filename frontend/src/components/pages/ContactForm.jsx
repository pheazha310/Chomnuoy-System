import { Send } from 'lucide-react';

export default function ContactForm() {
  return (
    <div className="contact-form-card">
      <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
        <div className="contact-form-row">
          <label>
            <span>Full Name</span>
            <input 
              className="contact-input"
              placeholder="Jane Doe" 
              type="text" 
            />
          </label>
          <label>
            <span>Email Address</span>
            <input 
              className="contact-input"
              placeholder="jane@example.com" 
              type="email" 
            />
          </label>
        </div>
        <label>
          <span>Subject</span>
          <input 
            className="contact-input"
            placeholder="How can we help you?" 
            type="text" 
          />
        </label>
        <label>
          <span>Message</span>
          <textarea 
            className="contact-textarea"
            placeholder="Write your message here..." 
            rows={7}
          ></textarea>
        </label>
        <button 
          className="contact-submit-btn"
          type="submit"
        >
          <span>Send Message</span>
          <Send className="size-4" />
        </button>

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
