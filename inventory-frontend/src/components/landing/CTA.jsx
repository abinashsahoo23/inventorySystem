import { Link } from "react-router-dom";
import Aurora from "../effects/Aurora/Aurora";
import "./CTA.css";

function CTA() {
  return (
    <section
      className="landing-section landing-cta-section"
      id="get-started"
      aria-labelledby="landing-cta-title"
    >
      <div className="landing-cta-shell">

        {/* =====================================
            AURORA BACKGROUND
            ===================================== */}

        <div
          className="landing-cta-aurora"
          aria-hidden="true"
        >
          <Aurora
            colorStops={[
              "#3d35c9",
              "#0da5c0",
              "#4ed7bd",
            ]}
            amplitude={1.05}
            blend={0.72}
            speed={0.55}
          />
        </div>


        {/* =====================================
            GRID
            ===================================== */}

        <div
          className="landing-cta-grid"
          aria-hidden="true"
        />


        {/* =====================================
            READABILITY LAYER
            ===================================== */}

        <div
          className="landing-cta-overlay"
          aria-hidden="true"
        />


        {/* =====================================
            CENTERED CONTENT
            ===================================== */}

        <div className="landing-cta-content">

          <span className="landing-cta-kicker">
            <span className="landing-cta-kicker-line" />

            Ready to get started

            <span className="landing-cta-kicker-line" />
          </span>


          <h2 id="landing-cta-title">

            <span className="landing-cta-main-text">
              Bring your operation
            </span>{" "}

            <span className="landing-cta-shine-text">
              together.
            </span>

          </h2>


          <p className="landing-cta-description">
            Manage products, stock, warehouses, orders and
            reporting from one connected inventory system
            built around the way your team works.
          </p>


          {/* =================================
              ACTIONS
              ================================= */}

          <div className="landing-cta-actions">

            <Link
              to="/register"
              className="
                landing-cta-button
                landing-cta-button-primary
              "
            >
              Create your account
            </Link>


            <Link
              to="/login"
              className="
                landing-cta-button
                landing-cta-button-secondary
              "
            >
              Sign in
            </Link>

          </div>


          {/* =================================
              SUPPORTING COPY
              ================================= */}

          <p className="landing-cta-support">
            Start with your existing operation and organize
            everything in one place.
          </p>

        </div>

      </div>
    </section>
  );
}

export default CTA;