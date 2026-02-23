import './css/Footer.css';

const exploreLinks = ['Featured Causes', 'Newest Projects', 'Education', 'Health & Wellness', 'Environment'];
const resourceLinks = ['About Us', 'How it Works', 'Transparency', 'Success Stories', 'Help Center'];
const policyLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy'];

function Footer() {
  return (
    <footer className="site-footer" aria-label="Footer">
      <div className="footer-top">
        <section className="footer-col footer-brand">
          <div className="footer-logo" aria-label="Chomnuoy logo">
            <span className="footer-logo-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="footer-logo-mark" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4.8 14.2L8.2 10.8C8.5 10.5 8.9 10.3 9.3 10.3H12.3C13.2 10.3 13.9 9.6 13.9 8.7C13.9 7.8 13.2 7.1 12.3 7.1H9.7C8.9 7.1 8.2 7.4 7.6 8L5.9 9.7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.4 12.8L11.1 16.5C11.7 17.1 12.5 17.4 13.3 17.4H15.5C16.7 17.4 17.8 16.4 17.8 15.1C17.8 13.9 16.8 12.9 15.5 12.9H13.7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 9L3.8 10.2C3.3 10.7 3.3 11.5 3.8 12L4.8 13C5.3 13.5 6.1 13.5 6.6 13L7.8 11.8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.6 5.3C16.1 4.7 15.4 4.4 14.6 4.4C13.2 4.4 12 5.6 12 7C12 8.2 12.9 9.3 14.2 9.6C14.8 9.7 15.7 9.7 16.2 9.5C17.4 9.1 18.2 8.1 18.2 7C18.2 6.4 18 5.8 17.6 5.3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="footer-logo-text">
              <span className="footer-logo-title">{'\u1787\u17c6\u1793\u17bd\u1799 / CHOMNUOY'}</span>
              <span className="footer-logo-subtitle">DIGITAL DONATION PLATFORM</span>
            </span>
          </div>
          <p>
            Chomnuoy is a global crowdfunding platform dedicated to empowering local communities and fostering
            sustainable growth through collective giving.
          </p>
          <div className="footer-socials">
            <a href="#" aria-label="Website">
              {'\u25cb'}
            </a>
            <a href="#" aria-label="Contact">
              @
            </a>
            <a href="#" aria-label="Share">
              {'\u2197'}
            </a>
          </div>
        </section>

        <section className="footer-col">
          <h3>Explore</h3>
          <ul>
            {exploreLinks.map((item) => (
              <li key={item}>
                <a href="#">{item}</a>
              </li>
            ))}
          </ul>
        </section>

        <section className="footer-col">
          <h3>Resources</h3>
          <ul>
            {resourceLinks.map((item) => (
              <li key={item}>
                <a href="#">{item}</a>
              </li>
            ))}
          </ul>
        </section>

        <section className="footer-col">
          <h3>Newsletter</h3>
          <p className="newsletter-copy">Stay updated with the latest causes and impact reports.</p>
          <form className="newsletter-form" onSubmit={(event) => event.preventDefault()}>
            <input type="email" placeholder="Email address" aria-label="Email address" />
            <button type="submit" aria-label="Subscribe">
              &gt;
            </button>
          </form>
        </section>
      </div>

      <div className="footer-bottom">
        <p>{'\u00a9 2026 CHOMNUOY PLATFORM. ALL RIGHTS RESERVED.'}</p>
        <div className="footer-policies">
          {policyLinks.map((item) => (
            <a href="#" key={item}>
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
