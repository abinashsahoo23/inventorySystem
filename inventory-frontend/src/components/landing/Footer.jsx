import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const handleBackToTop = (event) => {
    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer
      className="landing-footer"
      aria-label="Site footer"
    >
      <div className="landing-footer-shell">

        {/* =====================================
            MAIN FOOTER
            ===================================== */}

        <div className="landing-footer-main">

          {/* =================================
              BRAND
              ================================= */}

          <div className="landing-footer-brand-area">

            <Link
              to="/"
              className="landing-footer-brand"
              aria-label="Inventory home"
            >
              INVENTORY
            </Link>

            <p className="landing-footer-description">
              A connected inventory management system
              for products, stock, warehouses, purchasing,
              sales and operational reporting.
            </p>

          </div>


          {/* =================================
              PLATFORM
              ================================= */}

          <div className="landing-footer-column">

            <h2>
              Platform
            </h2>

            <a href="#features">
              Features
            </a>

            <a href="#how-it-works">
              How it works
            </a>

            <a href="#roles">
              Roles
            </a>

          </div>


          {/* =================================
              ACCOUNT
              ================================= */}

          <div className="landing-footer-column">

            <h2>
              Account
            </h2>

            <Link to="/login">
              Sign in
            </Link>

            <Link to="/register">
              Create account
            </Link>

            <a href="#get-started">
              Get started
            </a>

          </div>

        </div>


        {/* =====================================
            DIVIDER
            ===================================== */}

        <div className="landing-footer-divider" />


        {/* =====================================
            BOTTOM
            ===================================== */}

        <div className="landing-footer-bottom">

          <div className="landing-footer-legal">

            <span>
              © {new Date().getFullYear()} Inventory
              Management System
            </span>

            <span>
              Built for connected operations.
            </span>

          </div>


          <a
            href="#top"
            className="landing-footer-top"
            onClick={handleBackToTop}
          >
            Back to top

            <span aria-hidden="true">
              ↑
            </span>
          </a>

        </div>

      </div>
    </footer>
  );
}

export default Footer;