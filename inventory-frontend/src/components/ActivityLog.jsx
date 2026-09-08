import { useEffect, useState } from "react";
import { api } from "../api";

const actionIcon = {
  Added: "bi-plus-circle text-success",
  Updated: "bi-pencil text-primary",
  Deleted: "bi-trash text-danger",
  Deactivated: "bi-slash-circle text-warning",
  Approved: "bi-check-circle text-success",
};

export default function ActivityLog({ entityType, title }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    let loading = false;

    async function load() {
      if (loading) return;
      loading = true;

      try {
        const result = await api.getActivityLogs(entityType);

        if (!mounted) return;
        setLogs(Array.isArray(result) ? result : []);
        setError("");
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Unable to load activity.");
      } finally {
        loading = false;
      }
    }

    load();
    const interval = setInterval(load, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [entityType]);

  return (
    <div className="bg-white rounded-4 shadow overflow-hidden mb-4 user-dashboard-surface">
      <div className="p-3 p-md-4">
        <h5 className="mb-3">
          <i className="bi bi-clock-history me-2"></i>
          {title}
        </h5>

        {error && (
          <div className="alert alert-warning mb-3" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {logs.length === 0 ? (
          <p className="text-muted mb-0">No activity yet.</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {logs.map((log) => (
              <li
                key={log.id}
                className="d-flex align-items-center gap-2 py-2 border-bottom"
              >
                <i
                  className={`bi ${actionIcon[log.action] || "bi-info-circle text-muted"}`}
                ></i>
                <span>
                  <strong>{log.performedBy || "Unknown User"}</strong>{" "}
                  ({log.performedByRole || "User"}) {String(log.action || "updated").toLowerCase()} {" "}
                  <strong>{log.targetName || "item"}</strong>
                </span>
                <span className="text-muted small ms-auto text-nowrap">
                  {log.timestamp
                    ? new Date(log.timestamp).toLocaleString()
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
