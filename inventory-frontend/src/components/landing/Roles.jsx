import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import "./Roles.css";

const roles = [
  {
    id: "system-administrator",
    name: "System Administrator",
    title: "Manage the system, users and access.",
    description:
      "Configure users, roles and permissions while maintaining control over the inventory management system and its operational access.",
    areas: [
      "User management",
      "Roles & permissions",
      "System configuration",
    ],
  },
  {
    id: "inventory-manager",
    name: "Inventory Manager",
    title: "Keep stock accurate and easy to understand.",
    description:
      "Monitor products, stock levels, movements and availability across the warehouses your team manages.",
    areas: [
      "Stock control",
      "Product availability",
      "Movement history",
    ],
  },
  {
    id: "warehouse-manager",
    name: "Warehouse Manager",
    title: "Keep every warehouse running accurately.",
    description:
      "Oversee receiving, stock transfers and warehouse quantities while keeping each location organised and up to date.",
    areas: [
      "Warehouse operations",
      "Stock transfers",
      "Receiving",
    ],
  },
  {
    id: "procurement-officer",
    name: "Procurement Officer",
    title: "Manage purchasing from supplier to stock.",
    description:
      "Work with suppliers and purchase orders while ensuring incoming goods are properly recorded and connected to inventory.",
    areas: [
      "Supplier management",
      "Purchase orders",
      "Goods receiving",
    ],
  },
  {
    id: "sales-manager",
    name: "Sales Manager",
    title: "Work from the stock that is actually available.",
    description:
      "Manage customer orders using current inventory information so the sales team can work with a clearer understanding of availability.",
    areas: [
      "Customer orders",
      "Sales management",
      "Stock availability",
    ],
  },
  {
    id: "finance-manager",
    name: "Finance Manager",
    title: "Understand the financial side of inventory.",
    description:
      "Review purchasing, sales and inventory records to understand the financial impact of the operation and support better decisions.",
    areas: [
      "Purchase records",
      "Sales records",
      "Operational reporting",
    ],
  },
];

const WHEEL_LOCK_DURATION = 520;
const TRANSITION_DURATION = 460;
const SWIPE_THRESHOLD = 45;

function Roles() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);
  const [transitionDirection, setTransitionDirection] =
    useState("next");
  const [isTransitioning, setIsTransitioning] =
    useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const wheelLockRef = useRef(false);
  const wheelTimerRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const touchStartYRef = useRef(null);

  /*
   * Reveal section when it enters the viewport.
   */
  useEffect(() => {
    const section =
      document.getElementById("roles");

    if (!section) {
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);

            observer.disconnect();
          }
        },
        {
          threshold: 0.08,
        }
      );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  /*
   * Clean up timers.
   */
  useEffect(() => {
    return () => {
      if (wheelTimerRef.current) {
        window.clearTimeout(
          wheelTimerRef.current
        );
      }

      if (transitionTimerRef.current) {
        window.clearTimeout(
          transitionTimerRef.current
        );
      }
    };
  }, []);

  /*
   * Move one role at a time.
   */
  const changeRole = useCallback(
    (direction) => {
      if (wheelLockRef.current) {
        return;
      }

      wheelLockRef.current = true;

      setTransitionDirection(direction);

      setActiveIndex((current) => {
        setPreviousIndex(current);

        if (direction === "next") {
          return (
            (current + 1) %
            roles.length
          );
        }

        return (
          (current - 1 + roles.length) %
          roles.length
        );
      });

      setIsTransitioning(true);

      /*
       * Unlock the wheel after one gesture.
       */
      wheelTimerRef.current =
        window.setTimeout(() => {
          wheelLockRef.current = false;

          wheelTimerRef.current = null;
        }, WHEEL_LOCK_DURATION);

      /*
       * Finish visual transition.
       */
      transitionTimerRef.current =
        window.setTimeout(() => {
          setIsTransitioning(false);
          setPreviousIndex(null);

          transitionTimerRef.current = null;
        }, TRANSITION_DURATION);
    },
    []
  );

  /*
   * Wheel / trackpad.
   *
   * One meaningful wheel movement changes
   * exactly one role.
   */
  useEffect(() => {
    const field =
      document.querySelector(
        ".inventory-roles-field"
      );

    if (!field) {
      return undefined;
    }

    const handleWheel = (event) => {
      event.preventDefault();

      if (wheelLockRef.current) {
        return;
      }

      const delta =
        Math.abs(event.deltaY) >=
        Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;

      if (Math.abs(delta) < 8) {
        return;
      }

      changeRole(
        delta > 0
          ? "next"
          : "previous"
      );
    };

    field.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: false,
      }
    );

    return () => {
      field.removeEventListener(
        "wheel",
        handleWheel
      );
    };
  }, [changeRole]);

  /*
   * Touch swipe.
   */
  const handleTouchStart = (event) => {
    const y =
      event.touches[0]?.clientY;

    touchStartYRef.current =
      typeof y === "number"
        ? y
        : null;
  };

  const handleTouchEnd = (event) => {
    if (
      touchStartYRef.current === null
    ) {
      return;
    }

    const endY =
      event.changedTouches[0]?.clientY;

    if (typeof endY !== "number") {
      touchStartYRef.current = null;
      return;
    }

    const distance =
      touchStartYRef.current -
      endY;

    touchStartYRef.current = null;

    if (
      Math.abs(distance) <
      SWIPE_THRESHOLD
    ) {
      return;
    }

    changeRole(
      distance > 0
        ? "next"
        : "previous"
    );
  };

  /*
   * Keyboard navigation.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      const section =
        document.getElementById("roles");

      if (!section) {
        return;
      }

      const rect =
        section.getBoundingClientRect();

      const visible =
        rect.top <
          window.innerHeight &&
        rect.bottom > 0;

      if (!visible) {
        return;
      }

      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();

        changeRole("next");
      }

      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();

        changeRole("previous");
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
  }, [changeRole]);

  const currentRole =
    roles[activeIndex];

  const previousRole =
    previousIndex !== null
      ? roles[previousIndex]
      : null;

  return (
    <section
      id="roles"
      className={`inventory-roles ${
        isVisible
          ? "is-visible"
          : ""
      }`}
      aria-labelledby="roles-title"
    >
      <div className="inventory-roles-container">

        {/* =====================================
            INTRO
            ===================================== */}

        <div className="inventory-roles-intro">

          <span className="inventory-roles-kicker">
            Roles
          </span>

          <h2 id="roles-title">
            Built for every
            <br />
            part of the operation.
          </h2>

          <p>
            Everyone works from the same operational
            data, with a view that matches the work
            they are responsible for.
          </p>

        </div>


        {/* =====================================
            ROLE FIELD
            ===================================== */}

        <div className="inventory-roles-stage">

          <div
            className="inventory-roles-field"
            tabIndex={0}
            aria-label="Inventory system roles"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >

            {/* =================================
                TOP DEPTH
                ================================= */}

            <div
              className="
                inventory-roles-field-depth
                inventory-roles-field-depth-top
              "
              aria-hidden="true"
            />


            {/* =================================
                PREVIOUS ROLE
                ================================= */}

            {isTransitioning &&
              previousRole && (
                <article
                  className={`inventory-role
                    inventory-role-previous
                    ${transitionDirection}
                  `}
                  aria-hidden="true"
                >
                  <div className="inventory-role-main">

                    <h3>
                      {previousRole.name}
                    </h3>

                    <p className="inventory-role-title">
                      {previousRole.title}
                    </p>

                  </div>
                </article>
              )}


            {/* =================================
                CURRENT / NEW ROLE
                ================================= */}

            <article
              key={currentRole.id}
              className={`inventory-role
                inventory-role-current
                ${
                  isTransitioning
                    ? `is-entering ${transitionDirection}`
                    : "is-active"
                }
              `}
              aria-live="polite"
            >

              <div className="inventory-role-main">

                <h3>
                  {currentRole.name}
                </h3>

                <p className="inventory-role-title">
                  {currentRole.title}
                </p>

                <p className="inventory-role-description">
                  {currentRole.description}
                </p>

                <div className="inventory-role-areas">

                  {currentRole.areas.map(
                    (area) => (
                      <span key={area}>
                        {area}
                      </span>
                    )
                  )}

                </div>

              </div>

            </article>


            {/* =================================
                BOTTOM DEPTH
                ================================= */}

            <div
              className="
                inventory-roles-field-depth
                inventory-roles-field-depth-bottom
              "
              aria-hidden="true"
            />

          </div>

        </div>

      </div>
    </section>
  );
}

export default Roles;