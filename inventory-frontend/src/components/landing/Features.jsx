import { useCallback, useEffect, useState } from "react";
import "./Features.css";

const features = [
  {
    id: "inventory",
    eyebrow: "Inventory control",
    fadedLabel: "INVENTORY",
    title: "Know what you have before you move it.",
    description:
      "Keep a reliable view of stock across products and warehouses. Follow quantities, movements and availability without piecing information together from different places.",
    points: [
      "Live stock visibility by product",
      "Warehouse-level quantities and availability",
      "Complete movement history",
    ],
  },
  {
    id: "warehouses",
    eyebrow: "Warehouse management",
    fadedLabel: "WAREHOUSES",
    title: "Keep every warehouse connected.",
    description:
      "Manage multiple locations from one operational view. Understand where stock is held, how it is moving and what each warehouse has available.",
    points: [
      "Central view across warehouse locations",
      "Stock availability by site",
      "Clear location-based operations",
    ],
  },
  {
    id: "purchasing",
    eyebrow: "Purchasing",
    fadedLabel: "PURCHASING",
    title: "Turn purchasing into a controlled process.",
    description:
      "Keep suppliers, purchase orders and receiving connected to the inventory they affect, giving your team a clearer path from request to received stock.",
    points: [
      "Central supplier information",
      "Purchase orders and receiving workflow",
      "Purchasing history linked to stock",
    ],
  },
  {
    id: "sales",
    eyebrow: "Sales operations",
    fadedLabel: "SALES",
    title: "Sell with a clearer view of availability.",
    description:
      "Create and manage sales orders using the same inventory information your operations team relies on, so orders are based on what is actually available.",
    points: [
      "Sales orders tied to inventory",
      "Availability checks before fulfilment",
      "Order history in one place",
    ],
  },
  {
    id: "reports",
    eyebrow: "Reporting",
    fadedLabel: "REPORTING",
    title: "Turn operational activity into useful answers.",
    description:
      "Bring inventory, purchasing, sales and activity data together so managers can understand what is happening and make decisions with more confidence.",
    points: [
      "Inventory and movement reporting",
      "Purchasing and sales insights",
      "Role-based access to operational data",
    ],
  },
];

function Features() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const currentFeature = features[activeIndex];

  const goToFeature = useCallback((index) => {
    setActiveIndex(
      (index + features.length) % features.length
    );
  }, []);

  const goNext = useCallback(() => {
    goToFeature(activeIndex + 1);
  }, [activeIndex, goToFeature]);

  const goPrevious = useCallback(() => {
    goToFeature(activeIndex - 1);
  }, [activeIndex, goToFeature]);

  /*
   * Reveal section when it enters the viewport.
   */
  useEffect(() => {
    const section = document.getElementById("features");

    if (!section) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  /*
   * Automatic slide rotation.
   */
  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveIndex(
        (index) => (index + 1) % features.length
      );
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  /*
   * Keyboard navigation.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      const section = document.getElementById("features");

      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();

      const isOnScreen =
        rect.top < window.innerHeight * 0.8 &&
        rect.bottom > window.innerHeight * 0.2;

      if (!isOnScreen) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goNext, goPrevious]);

  return (
    <section
      id="features"
      className={`inventory-features ${
        isVisible ? "is-visible" : ""
      }`}
      aria-labelledby="features-title"
    >
      <div className="inventory-feature-container">

        {/* SECTION INTRO */}

        <div className="inventory-feature-intro">

          <h2 id="features-title">
            Less hunting.
            <br />
            More knowing.
          </h2>

          <p>
            One connected system for the stock, locations,
            purchasing, sales and operational information your
            team works with every day.
          </p>

        </div>

        {/* FEATURE CAROUSEL */}

        <div
          className="inventory-feature-stage"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >

          <article
            className="inventory-feature-card"
            key={currentFeature.id}
            aria-live="polite"
          >

            {/* Decorative background word */}

            <span
              className="inventory-feature-faded-word"
              aria-hidden="true"
            >
              {currentFeature.fadedLabel}
            </span>

            {/* Card top */}

            <div className="inventory-feature-top">

              <span className="inventory-feature-eyebrow">
                {currentFeature.eyebrow}
              </span>

            </div>

            {/* Main content */}

            <div className="inventory-feature-content">

              <div className="inventory-feature-copy">

                <h3>
                  {currentFeature.title}
                </h3>

                <p>
                  {currentFeature.description}
                </p>

                <div className="inventory-feature-points">

                  {currentFeature.points.map((point) => (
                    <div
                      className="inventory-feature-point"
                      key={point}
                    >
                      <span
                        className="inventory-feature-check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>

                      <span>{point}</span>
                    </div>
                  ))}

                </div>

              </div>

            </div>

            {/* Card footer */}

            <div className="inventory-feature-footer">

              <div className="inventory-feature-progress">

                <span
                  style={{
                    width: `${
                      ((activeIndex + 1) /
                        features.length) *
                      100
                    }%`,
                  }}
                />

              </div>

              <div className="inventory-feature-controls">

                <button
                  type="button"
                  className="inventory-feature-arrow"
                  aria-label="Previous feature"
                  onClick={goPrevious}
                >
                  ←
                </button>

                <button
                  type="button"
                  className="inventory-feature-arrow"
                  aria-label="Next feature"
                  onClick={goNext}
                >
                  →
                </button>

              </div>

            </div>

          </article>

        </div>

      </div>
    </section>
  );
}

export default Features;