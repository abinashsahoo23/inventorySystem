import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const links = [
  ["Features", "#features"],
  ["How it works", "#how-it-works"],
  ["Roles", "#roles"],
];

function Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span>INVENTORY</span>
        </Link>

        <nav className="navbar-links" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="navbar-actions">
          <Link to="/login" className="navbar-login">
            Sign in
          </Link>
          <Link to="/register" className="btn btn-primary navbar-cta">
            Get started
          </Link>
        </div>

        <button
          type="button"
          className={`navbar-menu-button ${open ? "is-open" : ""}`}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`navbar-mobile ${open ? "is-open" : ""}`}>
        {links.map(([label, href]) => (
          <a key={href} href={href} onClick={closeMenu}>
            {label}
          </a>
        ))}

        <div className="navbar-mobile-actions">
          <Link to="/login" className="navbar-login" onClick={closeMenu}>
            Sign in
          </Link>
          <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
