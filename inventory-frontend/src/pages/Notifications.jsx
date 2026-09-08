import { useEffect, useState } from "react";
import { api } from "../api";

export default function Notifications() {
  const [notifications, setNotifications] =
    useState([]);

  const [unreadOnly, setUnreadOnly] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadNotifications() {
    setLoading(true);
    setError("");

    try {
      const data =
        await api.getNotifications(
          unreadOnly
        );

      setNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  async function markAsRead(id) {
    try {
      await api.markNotificationAsRead(
        id
      );

      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markAllAsRead() {
    try {
      await api.markAllNotificationsAsRead();

      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteNotification(id) {
    try {
      await api.deleteNotification(id);

      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="mb-4">
        <h3>Notifications</h3>

        <p className="text-muted mb-0">
          View system alerts and updates.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="bg-white rounded-4 shadow p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div className="form-check">
            <input
              id="unreadOnly"
              type="checkbox"
              className="form-check-input"
              checked={unreadOnly}
              onChange={(event) =>
                setUnreadOnly(
                  event.target.checked
                )
              }
            />

            <label
              htmlFor="unreadOnly"
              className="form-check-label"
            >
              Unread only
            </label>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={markAllAsRead}
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow overflow-hidden">
        {loading ? (
          <div className="p-4 text-muted">
            Loading notifications...
          </div>
        ) : (
          <div>
            {notifications.map(
              (notification) => (
                <div
                  key={
                    notification.id
                  }
                  className={`p-3 border-bottom ${
                    notification.isRead
                      ? ""
                      : "bg-light"
                  }`}
                >
                  <div className="d-flex justify-content-between gap-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <strong>
                          {
                            notification.title
                          }
                        </strong>

                        {!notification.isRead && (
                          <span className="badge text-bg-primary">
                            New
                          </span>
                        )}
                      </div>

                      <div>
                        {
                          notification.message
                        }
                      </div>

                      <div className="small text-muted mt-1">
                        {
                          notification.type
                        }{" "}
                        ·{" "}
                        {new Date(
                          notification.createdAt
                        ).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-nowrap">
                      {!notification.isRead && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() =>
                            markAsRead(
                              notification.id
                            )
                          }
                        >
                          Read
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          deleteNotification(
                            notification.id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}

            {notifications.length ===
              0 && (
              <div className="p-4 text-center text-muted">
                No notifications.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}