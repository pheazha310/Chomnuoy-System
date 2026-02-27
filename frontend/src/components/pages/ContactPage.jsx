
import '../css/contact.css';
import ContactForm from '../pages/ContactForm';
import ContactInfo from '../pages/ContactInfo';
import SupportSection from '../pages/Suppourtsection';
import { ArrowRight } from 'lucide-react';
export default function ContactPage() {
  return (
    <div className="contact-shell">
      <section className="contact-hero-wrap">
        <div className="contact-hero-card contact-hero-card-full">
          <img
            src="https://borgenproject.org/wp-content/uploads/Disability-and-Poverty-in-Cambodia-1030x579.jpg"
            alt="Community"
            className="contact-hero-bg"
            referrerPolicy="no-referrer"
          />
          <div className="contact-hero-overlay"></div>
          <div className="contact-hero-content">
            <h1>Get in Touch. Connecting Hearts, Empowering Communities.</h1>
            <p>
              A bridge between those who want to help and those who need it most. Join our ecosystem of transparent giving.
            </p>
            <div className="contact-hero-actions">
              <button className="contact-hero-btn contact-hero-btn-primary">
                Donate Now
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="contact-hero-btn contact-hero-btn-secondary">Join Us</button>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-intro-wrap">
        <div className="contact-container">
          <div className="contact-intro-card">
            <div className="contact-intro-tab"></div>
            <div className="contact-intro-content">
              <h2>Get in Touch</h2>
              <p>
                We&apos;re here to help you grow. Reach out to our team for personalized support or any business inquiries.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-main-wrap">
        <div className="contact-contain">
          <div className="contact-main-grid">
            <div>
              <ContactForm />
            </div>
            <div>
              <ContactInfo />
            </div>
          </div>
        </div>
      </section>

      <section className="contact-support-wrap">
        <div className="contact-container">
          <SupportSection />
        </div>
      </section>
    </div>
  );
}
