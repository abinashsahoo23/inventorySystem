import { useCallback, useEffect, useRef, useState } from "react";
import "./HowItWorks.css";

const steps = [
  {
    id: "setup",
    number: "01",
    eyebrow: "Set up your inventory",
    title: "Start with a clear structure.",
    text:
      "Add products, categories, brands, SKUs and warehouses so every item begins with the right information and location.",
    points: [
      "Products and SKUs",
      "Categories and brands",
      "Warehouse locations",
    ],
  },
  {
    id: "stock",
    number: "02",
    eyebrow: "Record stock",
    title: "Keep quantities up to date.",
    text:
      "Record stock coming in, going out, being adjusted or transferred so quantities stay connected to the warehouse where they actually exist.",
    points: [
      "Stock in and stock out",
      "Adjustments and transfers",
      "Warehouse-level quantities",
    ],
  },
  {
    id: "orders",
    number: "03",
    eyebrow: "Process orders",
    title: "Connect buying and selling to stock.",
    text:
      "Create purchase orders and sales orders against the same inventory layer so operations can work from the stock that is actually available.",
    points: [
      "Purchase orders",
      "Sales orders",
      "Inventory-aware fulfilment",
    ],
  },
  {
    id: "decisions",
    number: "04",
    eyebrow: "Review the operation",
    title: "Use the activity to make decisions.",
    text:
      "Follow inventory activity, low-stock conditions, purchasing and sales information to understand what needs attention and what happens next.",
    points: [
      "Activity and history",
      "Low-stock visibility",
      "Operational reporting",
    ],
  },
];

function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] =
    useState("next");

  const transitionTimer = useRef(null);

  const currentStep = steps[displayedIndex];

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimer.current) {
      window.clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
  }, []);

  const changeStep = useCallback(
    (nextIndex, direction = "next") => {
      const normalizedIndex =
        (nextIndex + steps.length) % steps.length;

      if (
        normalizedIndex === displayedIndex ||
        isTransitioning
      ) {
        return;
      }

      clearTransitionTimer();

      setTransitionDirection(direction);
      setActiveIndex(normalizedIndex);
      setIsTransitioning(true);

      transitionTimer.current = window.setTimeout(() => {
        setDisplayedIndex(normalizedIndex);

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setIsTransitioning(false);
          });
        });

        transitionTimer.current = null;
      }, 180);
    },
    [
      displayedIndex,
      isTransitioning,
      clearTransitionTimer,
    ]
  );

  const goNext = useCallback(() => {
    changeStep(activeIndex + 1, "next");
  }, [activeIndex, changeStep]);

  const goPrevious = useCallback(() => {
    changeStep(activeIndex - 1, "previous");
  }, [activeIndex, changeStep]);

  /*
   * Reveal section when it enters the viewport.
   */
  useEffect(() => {
    const section =
      document.getElementById("how-it-works");

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
        threshold: 0.1,
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  /*
   * Automatic rotation.
   */
  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      if (!isTransitioning) {
        const nextIndex =
          (activeIndex + 1) % steps.length;

        changeStep(nextIndex, "next");
      }
    }, 5200);

    return () => window.clearInterval(interval);
  }, [
    activeIndex,
    changeStep,
    isPaused,
    isTransitioning,
  ]);

  /*
   * Keyboard navigation.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      const section =
        document.getElementById("how-it-works");

      if (!section) {
        return;
      }

      const rect =
        section.getBoundingClientRect();

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

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [goNext, goPrevious]);

  /*
   * Clean up pending transition.
   */
  useEffect(() => {
    return () => {
      clearTransitionTimer();
    };
  }, [clearTransitionTimer]);

  return (
    <section
      id="how-it-works"
      className={`inventory-how-it-works ${
        isVisible ? "is-visible" : ""
      }`}
      aria-labelledby="how-it-works-title"
    >
      <div className="inventory-how-container">

        {/* =====================================
            SECTION INTRO
            ===================================== */}

        <div className="inventory-how-intro">

          <h2 id="how-it-works-title">
            How it works.
          </h2>

          <p>
            A simple flow from setting up inventory
            to understanding what is happening
            across the operation.
          </p>

        </div>


        {/* =====================================
            WORKFLOW CARD
            ===================================== */}

        <div
          className="inventory-how-stage"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >

          <article className="inventory-how-card">

            <div
              className={`inventory-how-card-content-wrapper ${
                isTransitioning
                  ? `is-exiting ${transitionDirection}`
                  : "is-entering"
              }`}
            >

              {/* Large faded step number */}

              <span
                className="inventory-how-faded-number"
                aria-hidden="true"
              >
                {currentStep.number}
              </span>


              {/* Decorative glow */}

              <div
                className="inventory-how-card-glow"
                aria-hidden="true"
              />


              {/* =================================
                  TOP
                  ================================= */}

              <div className="inventory-how-card-top">

                <span className="inventory-how-card-label">
                  {currentStep.eyebrow}
                </span>

              </div>


              {/* =================================
                  MAIN CONTENT
                  ================================= */}

              <div className="inventory-how-card-main">

                <div className="inventory-how-copy">

                  <h3>
                    {currentStep.title}
                  </h3>

                  <p>
                    {currentStep.text}
                  </p>

                  <div className="inventory-how-points">

                    {currentStep.points.map(
                      (point) => (
                        <div
                          className="inventory-how-point"
                          key={point}
                        >
                          <span
                            className="inventory-how-point-mark"
                            aria-hidden="true"
                          >
                            ✓
                          </span>

                          <span>
                            {point}
                          </span>
                        </div>
                      )
                    )}

                  </div>

                </div>

              </div>


              {/* =================================
                  FOOTER
                  ================================= */}

              <div className="inventory-how-card-bottom">

                <div className="inventory-how-progress">

                  <span
                    style={{
                      width: `${
                        ((activeIndex + 1) /
                          steps.length) *
                        100
                      }%`,
                    }}
                  />

                </div>


                <div className="inventory-how-controls">

                  <button
                    type="button"
                    className="inventory-how-arrow"
                    aria-label="Previous step"
                    onClick={goPrevious}
                    disabled={isTransitioning}
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    className="inventory-how-arrow"
                    aria-label="Next step"
                    onClick={goNext}
                    disabled={isTransitioning}
                  >
                    →
                  </button>

                </div>

              </div>

            </div>

          </article>

        </div>

      </div>
    </section>
  );
}

export default HowItWorks;