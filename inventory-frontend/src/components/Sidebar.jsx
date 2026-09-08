import { NavLink, useNavigate } from "react-router-dom";

import { clearCurrentUser, getCurrentUser } from "./auth/session";
import { getSidebarItems } from "../routes/routeConfig";

// Groups purely control how the sidebar visually organises the
// items `getSidebarItems` already returns for the logged-in role.
// Anything not matched here still renders, bucketed into "More".
const NAV_GROUPS = [
  {
    label: "Overview",
    paths: ["/dashboard", "/admin"],
  },
  {
    label: "Catalog & Stock",
    paths: [
      "/products",
      "/catalog",
      "/inventory",
      "/low-stock",
      "/warehouses",
    ],
  },
  {
    label: "Trade",
    paths: ["/suppliers", "/purchases", "/customers", "/sales"],
  },
  {
    label: "Operations",
    paths: ["/tasks", "/finance", "/reports", "/notifications"],
  },
  {
    label: "System",
    paths: ["/settings"],
  },
];

function groupNavItems(items) {
  const claimed = new Set();

  const groups = NAV_GROUPS.map((group) => {
    const groupItems = items.filter((item) =>
      group.paths.includes(item.path)
    );

    groupItems.forEach((item) => claimed.add(item.path));

    return { label: group.label, items: groupItems };
  }).filter((group) => group.items.length > 0);

  const rest = items.filter((item) => !claimed.has(item.path));

  if (rest.length) {
    groups.push({ label: "More", items: rest });
  }

  return groups;
}

function getInitials(name) {
  return (name || "U")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Sidebar({ collapsed, mobileOpen, onToggleCollapsed, onCloseMobile }) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const items = getSidebarItems(user?.role);
  const groups = groupNavItems(items);

  function logout() {
    clearCurrentUser();
    navigate("/login", { replace: true });
  }

  return (
    <aside
      className={`app-sidebar ${collapsed ? "app-sidebar-collapsed" : ""} ${
        mobileOpen ? "app-sidebar-open" : ""
      }`}
    >
      <div className="app-sidebar-brand">

        <span className="app-sidebar-brand-text">INVENTORY</span>

        <div className="app-sidebar-brand-actions">
          <button
            type="button"
            className="app-sidebar-collapse"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i className={collapsed ? "bi bi-layout-sidebar-inset-reverse" : "bi bi-layout-sidebar-inset"} />
          </button>

          <button
            type="button"
            className="app-sidebar-close-mobile"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      </div>

      <nav className="app-sidebar-nav">
        {groups.map((group) => (
          <div className="app-sidebar-group" key={group.label}>
            <div className="app-sidebar-group-label">{group.label}</div>

            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `app-sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <i className={`bi ${item.icon}`} />
                <span className="app-sidebar-link-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="app-sidebar-footer">
        <div className="app-sidebar-user">
          <span className="app-avatar app-avatar-sm">
            {getInitials(user?.name)}
          </span>

          <div className="app-sidebar-user-info">
            <strong>{user?.name || "User"}</strong>
            <small>{user?.role || "Member"}</small>
          </div>
        </div>

        <button
          type="button"
          className="app-sidebar-logout"
          onClick={logout}
          title="Log out"
        >
          <i className="bi bi-box-arrow-right" />
          <span className="app-sidebar-link-label">Log out</span>
        </button>
      </div>
    </aside>
  );
}