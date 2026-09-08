import { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");


  useEffect(() => {
    api.getAdminOverview()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="text-white-50">Loading overview...</div>;

  return (
    <div className="mb-4">
      {/* Row of stat cards */}
      <div className="row g-3 mb-3">
        <StatCard icon="bi-people-fill" label="Total Users" value={data.totalUsers} color="primary" />
        <StatCard icon="bi-hourglass-split" label="Pending Approval" value={data.pendingUsers} color="warning" />
        <StatCard icon="bi-box-seam-fill" label="Total Products" value={data.totalProducts} color="info" />
        <StatCard icon="bi-exclamation-triangle-fill" label="Low Stock" value={data.lowStockProducts} color="danger" />
      </div>

      <div className="row g-3">
        {/* Role breakdown */}
        <div className="col-md-4">
          <div className="card bg-dark text-white h-100">
            <div className="card-body">
              <h6 className="card-title text-white-50">Users by Role</h6>
              {data.usersByRole.map((r) => (
                <div key={r.role} className="d-flex justify-content-between border-bottom border-secondary py-1">
                  <span>{r.role}</span>
                  <span className="badge text-bg-secondary">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stock value + out-of-stock */}
        <div className="col-md-4">
          <div className="card bg-dark text-white h-100">
            <div className="card-body">
              <h6 className="card-title text-white-50">Stock Summary</h6>
              <p className="mb-1">Total Stock Value: <strong>₹{data.totalStockValue.toFixed(2)}</strong></p>
              <p className="mb-0">Out of Stock Items: <strong>{data.outOfStockProducts}</strong></p>
            </div>
          </div>
        </div>

        {/* Recent activity feed */}
        <div className="col-md-4">
          <div className="card bg-dark text-white h-100">
            <div className="card-body">
              <h6 className="card-title text-white-50">Recent Activity</h6>
              {data.recentActivity.length === 0 && <p className="text-white-50 small">No activity yet.</p>}
              {data.recentActivity.map((a, i) => (
                <div key={i} className="small border-bottom border-secondary py-1">
                  <strong>{a.performedBy}</strong> {a.action.toLowerCase()} {a.entityType.toLowerCase()}{" "}
                  <em>{a.targetName}</em>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function StatCard({ icon, label, value, color }) {
  return (
    <div className="col-6 col-md-3">
      <div className={`card bg-dark border-${color} text-white h-100`}>
        <div className="card-body d-flex align-items-center gap-3">
          <i className={`bi ${icon} fs-3 text-${color}`}></i>
          <div>
            <div className="fs-4 fw-bold">{value}</div>
            <div className="small text-white-50">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}