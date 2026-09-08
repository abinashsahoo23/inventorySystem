import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";

const COLLAPSE_KEY = "sidebarCollapsed";

function readStoredCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AppLayout() {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(readStoredCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // localStorage may be unavailable (private mode) — safe to ignore.
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function toggleSidebar() {
    setCollapsed((value) => !value);
  }

  return (
    <div className={`app-shell ${collapsed ? "app-shell-collapsed" : ""}`}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={toggleSidebar}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <div
          className="app-shell-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <button
        type="button"
        className="app-mobile-menu-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        title="Open navigation menu"
      >
        <i className="bi bi-list" />
      </button>

      <div className="app-shell-main">
        <main className="app-shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
