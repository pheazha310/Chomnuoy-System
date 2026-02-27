import { MapPin, Phone, Mail, Linkedin, Twitter, Instagram } from 'lucide-react';

export default function ContactInfo() {
  return (
    <div className="contact-info-stack">
      <div className="contact-info-card">
        <h3>Contact Information</h3>

        <div className="contact-info-item">
          <div>
            <div className="contact-info-icon">
              <MapPin size={20} />
            </div>
          </div>
          <div>
            <h4>Office Address</h4>
            <p>123 Business Way, Suite 100, Tech City, TC 54321</p>
          </div>
        </div>

        <div className="contact-info-item">
          <div>
            <div className="contact-info-icon">
              <Phone size={20} />
            </div>
          </div>
          <div>
            <h4>Phone Number</h4>
            <p>+1 (555) 000-0000</p>
          </div>
        </div>

        <div className="contact-info-item">
          <div>
            <div className="contact-info-icon">
              <Mail size={20} />
            </div>
          </div>
          <div>
            <h4>Email Support</h4>
            <p>support@chomnuoy.com</p>
          </div>
        </div>

        <div className="contact-social-wrap">
          <h4>Follow Us</h4>
          <div className="contact-social-row">
            <a 
              href="https://www.linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="contact-social-btn"
            >
              <Linkedin size={18} />
            </a>
            <a 
              href="https://www.twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="contact-social-btn"
            >
              <Twitter size={18} />
            </a>
            <a 
              href="https://www.instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="contact-social-btn"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="contact-map-frame">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2483.5849186347284!2d-0.1276474!3d51.5073509!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487604b900d26973%3A0x4291f3172409ea92!2sLondon!5e0!3m2!1sen!2suk!4v1234567890"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
}
