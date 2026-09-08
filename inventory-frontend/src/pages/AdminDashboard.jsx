import { useEffect, useState } from "react";
import { api } from "../api";
import UserManagement from "../components/UserManagement";

// One consistent, brand-matched colour scale for every chart on this
// page — mirrors the --chart-1..8 tokens defined in variables.css so
// the dashboard never drifts onto an unrelated palette.
const CHART_COLORS = [
  "#635bff", // chart-1 · indigo (brand primary)
  "#0f9f95", // chart-3 · teal (brand secondary)
  "#18b7d8", // chart-2 · cyan (brand accent)
  "#d98b00", // chart-5 · amber
  "#67d8c7", // chart-4 · mint
  "#8f7ee8", // chart-7 · violet
  "#94a3b8", // chart-8 · slate
  "#ef6461", // chart-6 · coral
];

const ROLE_COLORS = {
  SuperAdmin: CHART_COLORS[0],
  InventoryManager: CHART_COLORS[1],
  WarehouseManager: CHART_COLORS[2],
  PurchaseOfficer: CHART_COLORS[3],
  SalesOfficer: CHART_COLORS[4],
  Accountant: CHART_COLORS[5],
  Staff: CHART_COLORS[6],
  Unassigned: CHART_COLORS[7],
};

function getRoleColor(role, index) {
  return ROLE_COLORS[role] || CHART_COLORS[index % CHART_COLORS.length];
}

function getActivityMeta(action) {
  const value = (action || "").toLowerCase();

  if (value.includes("delete")) {
    return { icon: "bi-trash", variant: "danger" };
  }

  if (value.includes("deactivate")) {
    return { icon: "bi-slash-circle", variant: "danger" };
  }

  if (value.includes("approve") || value.includes("activate")) {
    return { icon: "bi-check-circle", variant: "success" };
  }

  if (value.includes("create") || value.includes("add")) {
    return { icon: "bi-plus-circle", variant: "primary" };
  }

  if (value.includes("update") || value.includes("edit")) {
    return { icon: "bi-pencil", variant: "info" };
  }

  if (value.includes("login")) {
    return { icon: "bi-box-arrow-in-right", variant: "info" };
  }

  return { icon: "bi-activity", variant: "primary" };
}

function StatCard({ title, value, icon, text, variant = "primary" }) {
  return (
    <div className="col-6 col-lg-4">
      <div className="dashboard-stat-card">
        <div className="dashboard-stat-content">
          <div className="dashboard-stat-info">
            <div className="dashboard-stat-title">{title}</div>

            <div className="dashboard-stat-value">{value}</div>

            {text && <div className="dashboard-stat-text">{text}</div>}
          </div>

          <div
            className={`dashboard-stat-icon dashboard-stat-icon-${variant}`}
          >
            <i className={`bi ${icon}`}></i>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersPieChart({ roles }) {
  const total = roles.reduce((sum, item) => sum + item.count, 0);

  if (!roles.length || total === 0) {
    return (
      <div className="dashboard-empty">
        <i className="bi bi-people"></i>
        No user role data available.
      </div>
    );
  }

  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="row align-items-center">
      <div className="col-md-5 text-center">
        <div className="dashboard-donut">
          <svg width="210" height="210" viewBox="0 0 180 180">
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="var(--color-surface-soft)"
              strokeWidth="28"
            />

            {roles.map((item, index) => {
              const percentage = item.count / total;
              const length = percentage * circumference;
              const currentOffset = offset;

              offset += length;

              return (
                <circle
                  key={item.role}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={getRoleColor(item.role, index)}
                  strokeWidth="28"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-currentOffset}
                  strokeLinecap="butt"
                  transform="rotate(-90 90 90)"
                />
              );
            })}
          </svg>

          <div className="dashboard-donut-center">
            <strong>{total}</strong>
            <span>Total Users</span>
          </div>
        </div>
      </div>

      <div className="col-md-7 mt-4 mt-md-0">
        {roles.map((item, index) => (
          <div key={item.role} className="dashboard-role-row">
            <div className="d-flex align-items-center gap-2">
              <span
                className="dashboard-role-dot"
                style={{
                  backgroundColor: getRoleColor(item.role, index),
                }}
              ></span>

              <span>{item.role}</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <strong>{item.count}</strong>
              <span className="dashboard-muted small">
                ({total ? Math.round((item.count / total) * 100) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StockBarChart({ totalProducts, lowStock, outOfStock }) {
  const normalStock = Math.max(totalProducts - lowStock - outOfStock, 0);
  const maximum = Math.max(normalStock, lowStock, outOfStock, 1);

  const bars = [
    {
      name: "Normal Stock",
      value: normalStock,
      color: "var(--color-secondary)",
      numberClass: "",
    },
    {
      name: "Low Stock",
      value: lowStock,
      color: "var(--color-warning)",
      numberClass: "dashboard-number-low",
    },
    {
      name: "Out of Stock",
      value: outOfStock,
      color: "var(--color-danger)",
      numberClass: "dashboard-number-out",
    },
  ];

  return (
    <div className="dashboard-bars">
      {bars.map((bar) => (
        <div key={bar.name} className="dashboard-bar-item">
          <div className="d-flex justify-content-between mb-2">
            <span className="fw-semibold">{bar.name}</span>
            <strong>{bar.value}</strong>
          </div>

          <div className="dashboard-bar-track">
            <div
              className="dashboard-bar-fill"
              style={{
                width: `${(bar.value / maximum) * 100}%`,
                backgroundColor: bar.color,
              }}
            ></div>
          </div>
        </div>
      ))}

      <div className="row text-center mt-4">
        <div className="col-4">
          <div className="dashboard-chart-number">{normalStock}</div>
          <div className="dashboard-muted small">Normal</div>
        </div>

        <div className="col-4">
          <div className="dashboard-chart-number dashboard-number-low">
            {lowStock}
          </div>
          <div className="dashboard-muted small">Low Stock</div>
        </div>

        <div className="col-4">
          <div className="dashboard-chart-number dashboard-number-out">
            {outOfStock}
          </div>
          <div className="dashboard-muted small">Out of Stock</div>
        </div>
      </div>
    </div>
  );
}

function ActivityPanel({ activities }) {
  return (
    <div className="dashboard-scroll-area dashboard-activity-area">
      {activities.length === 0 ? (
        <div className="dashboard-empty">
          <i className="bi bi-clock-history"></i>
          No recent activity.
        </div>
      ) : (
        activities.map((item, index) => {
          const meta = getActivityMeta(item.action);

          return (
            <div
              key={`${item.timestamp}-${index}`}
              className="dashboard-activity-row"
            >
              <div
                className={`dashboard-activity-icon dashboard-activity-icon-${meta.variant}`}
              >
                <i className={`bi ${meta.icon}`}></i>
              </div>

              <div className="flex-grow-1">
                <div className="dashboard-activity-text">
                  <strong>{item.performedBy || "Unknown User"}</strong>{" "}
                  {item.action?.toLowerCase()}{" "}
                  <strong>{item.targetName || "item"}</strong>
                </div>

                <div className="dashboard-muted small mt-1">
                  {item.entityType || "System"} ·{" "}
                  {item.performedByRole || "User"}
                </div>
              </div>

              <div className="dashboard-muted small text-nowrap">
                {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const result = await api.getAdminOverview();

        if (!active) return;

        setData(result);
        setError("");
        setLoading(false);
      } catch (err) {
        if (!active) return;

        setError(err.message || "Failed to load admin dashboard.");
        setLoading(false);
      }
    }

    loadDashboard();

    const interval = setInterval(loadDashboard, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-border text-primary"></div>
        <span>Loading admin dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="alert alert-warning">
        No dashboard data available.
      </div>
    );
  }

  const roles = data.usersByRole || [];
  const activities = data.recentActivity || [];

  const pendingText =
    data.pendingUsers > 0
      ? `${data.pendingUsers} awaiting approval`
      : "All caught up";

  const stockIssues = data.lowStockProducts + data.outOfStockProducts;
  const stockText =
    stockIssues > 0
      ? `${stockIssues} item${stockIssues === 1 ? "" : "s"} need attention`
      : "Stock levels healthy";

  return (
    <div className="admin-dashboard">
      <div className="dashboard-page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>Monitor users, products, inventory and system activity.</p>
        </div>

      </div>

      <div className="dashboard-quick-actions">
        <a href="#user-management" className="dashboard-quick-action">
          <i className="bi bi-person-plus"></i>
          Add User
        </a>

        <a href="/products" className="dashboard-quick-action">
          <i className="bi bi-box-seam"></i>
          View Products
        </a>

        <a href="/low-stock" className="dashboard-quick-action">
          <i className="bi bi-exclamation-triangle"></i>
          Low Stock
        </a>

        <a href="/reports" className="dashboard-quick-action">
          <i className="bi bi-bar-chart"></i>
          Reports
        </a>
      </div>

      <div className="row g-3 mb-4">
        <StatCard
          title="Total Users"
          value={data.totalUsers}
          icon="bi-people"
          variant="primary"
        />

        <StatCard
          title="Pending Users"
          value={data.pendingUsers}
          icon="bi-person-exclamation"
          variant={data.pendingUsers > 0 ? "warning" : "success"}
          text={pendingText}
        />

        <StatCard
          title="Total Products"
          value={data.totalProducts}
          icon="bi-box-seam"
          variant="info"
        />

        <StatCard
          title="Low Stock"
          value={data.lowStockProducts}
          icon="bi-exclamation-triangle"
          variant={data.lowStockProducts > 0 ? "warning" : "success"}
        />

        <StatCard
          title="Out of Stock"
          value={data.outOfStockProducts}
          icon="bi-x-circle"
          variant={data.outOfStockProducts > 0 ? "danger" : "success"}
          text={stockText}
        />

        <StatCard
          title="Stock Value"
          value={`₹${Number(data.totalStockValue || 0).toLocaleString()}`}
          icon="bi-currency-rupee"
          variant="success"
        />
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="dashboard-card h-100">
            <div className="dashboard-card-header">
              <h5>
                <i className="bi bi-pie-chart-fill me-2"></i>
                Users by Role
              </h5>

              <p>Distribution of users by system role.</p>
            </div>

            <div className="dashboard-card-body">
              <UsersPieChart roles={roles} />
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="dashboard-card h-100">
            <div className="dashboard-card-header">
              <h5>
                <i className="bi bi-bar-chart-fill me-2"></i>
                Inventory Status
              </h5>

              <p>Current condition of product inventory.</p>
            </div>

            <div className="dashboard-card-body">
              <StockBarChart
                totalProducts={data.totalProducts}
                lowStock={data.lowStockProducts}
                outOfStock={data.outOfStockProducts}
              />
            </div>
          </div>
        </div>
      </div>

      <div id="user-management" className="mb-4">
        <UserManagement />
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h5>
            <i className="bi bi-clock-history me-2"></i>
            Recent Activity
          </h5>

          <p>Latest actions performed in the system.</p>
        </div>

        <div className="dashboard-card-body">
          <ActivityPanel activities={activities} />
        </div>
      </div>
    </div>
  );
}