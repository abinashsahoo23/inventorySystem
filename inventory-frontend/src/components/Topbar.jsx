import { useLocation } from "react-router-dom";

import { ROUTES } from "../routes/routeConfig";

function getPageMeta(pathname) {
  const match = Object.values(ROUTES).find(
    (route) => route.path === pathname
  );

  return match || { label: "Dashboard", icon: "bi-grid-1x2" };
}

export default function Topbar({
  collapsed,
  onToggleCollapsed,
  onOpenMobile,
}) {
  const location = useLocation();
  const meta = getPageMeta(location.pathname);

  return (
    <header className="app-topbar">
      <div className="app-topbar-left">
        <button
          type="button"
          className="app-topbar-icon-btn app-sidebar-toggle-desktop"
          onClick={onToggleCollapsed}
          aria-label="Toggle sidebar width"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className="bi bi-layout-sidebar-inset" />
        </button>

        <button
          type="button"
          className="app-topbar-icon-btn app-sidebar-toggle-mobile"
          onClick={onOpenMobile}
          aria-label="Open menu"
        >
          <i className="bi bi-list" />
        </button>

        <div className="app-topbar-title">
          <i className={`bi ${meta.icon}`} />
          <span>{meta.label}</span>
        </div>
      </div>
    </header>
  );
}
