import "./css/Navbar.css";

const navItems = [
  { label: "Home", href: "/" },
<<<<<<< HEAD
  { label: "About Us", href: "#" },
  { label: "Organizations", href: "/organizations" },
=======
  { label: "About Us", href: "/about" },
  { label: "Organizations", href: "#" },
>>>>>>> 8bf4f82a593542df8e5cbf628fc1ff7ee4f88aca
  { label: "Campaigns", href: "/campaigns" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Contact", href: "#" },
];

function Navbar() {
  const pathname = window.location.pathname;

  return (
    <nav className="navbar" aria-label="Primary">
      <a href="/" className="brand" aria-label="Chomnuoy home">
        <span className="brand-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            className="logo-mark"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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
        <span className="brand-text">
          <span className="brand-name">
            {"\u1787\u17c6\u1793\u17bd\u1799 / CHOMNUOY"}
          </span>
          <span className="brand-subtitle">DIGITAL DONATION PLATFORM</span>
        </span>
      </a>

      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              className={
                item.href === "/campaigns"
                  ? pathname === "/" || pathname.startsWith("/campaigns")
                    ? "active"
                    : ""
                  : item.href === "/organizations"
                    ? pathname === "/organizations"
                      ? "active"
                      : ""
                  : item.href === "/how-it-works"
                    ? pathname === "/how-it-works"
                      ? "active"
                      : ""
                      : item.href === "/about"
                        ? pathname === "/about"
                          ? "active"
                          : ""
                        : pathname === item.href
                          ? "active"
                          : ""
              }
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <button className="nav-cta" type="button">
        Donate Now
      </button>
    </nav>
  );
}

export default Navbar;
