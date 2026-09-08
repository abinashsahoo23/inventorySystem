import { useEffect, useState } from "react";
import { api } from "../api";
import { getCurrentUser } from "../components/auth/session";

const emptyForm = {
  title: "",
  description: "",
  assignedToUserId: "",
  dueDate: "",
};

const managerRoles = [
  "SuperAdmin",
  "InventoryManager",
  "WarehouseManager",
];

const statuses = [
  "Pending",
  "InProgress",
  "Completed",
  "Cancelled",
];

export default function Tasks() {
  const user = getCurrentUser();
  const canManage = managerRoles.includes(user?.role);

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState(canManage ? "all" : "mine");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadTasks() {
    setLoading(true);
    setError("");

    try {
      const data =
        view === "mine"
          ? await api.getMyTasks(status)
          : await api.getTasks(status);

      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    if (!canManage) return;

    try {
      const data = await api.getUsers();

      setUsers(
        data.filter(
          (item) =>
            item.status !== "Deactivated" &&
            item.role !== "SuperAdmin"
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [view, status]);

  useEffect(() => {
    loadUsers();
  }, []);

  function change(field, value) {
    setForm((form) => ({
      ...form,
      [field]: value,
    }));
  }

  function reset() {
    setForm(emptyForm);
  }

  async function createTask(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!form.assignedToUserId) {
      setError("Please select a user.");
      return;
    }

    setSaving(true);

    try {
      await api.createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        assignedToUserId: Number(form.assignedToUserId),
        dueDate: form.dueDate
          ? new Date(form.dueDate).toISOString()
          : null,
      });

      setMessage("Task created successfully.");
      reset();
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(task, newStatus) {
    setError("");
    setMessage("");

    try {
      await api.updateTaskStatus(task.id, newStatus);

      setMessage(
        `Task #${task.id} is now ${newStatus}.`
      );

      if (selected?.id === task.id) {
        await openTask(task.id);
      }

      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function openTask(id) {
    setError("");

    try {
      const [task, taskHistory] = await Promise.all([
        api.getTask(id),
        api.getTaskHistory(id),
      ]);

      setSelected(task);
      setHistory(taskHistory);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeTask(task) {
    if (!window.confirm(`Delete task #${task.id}?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const result = await api.deleteTask(task.id);

      setMessage(result.message);
      setSelected(null);
      setHistory([]);

      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  const canChangeStatus = (task) =>
    task.assignedToUserId === user?.id ||
    task.createdByUserId === user?.id;

  return (
    <>
      <div className="mb-4">
        <h3>Task Management</h3>
        <p className="text-muted mb-0">
          Create, assign and track work.
        </p>
      </div>

      {message && (
        <div className="alert alert-success py-2">
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-danger py-2">
          {error}
        </div>
      )}

      {/* Create task */}
      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <div className="d-flex gap-2 mb-3">
          {canManage && (
            <button
              type="button"
              className={`btn ${
                view === "all"
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => setView("all")}
            >
              All Tasks
            </button>
          )}

          <button
            type="button"
            className={`btn ${
              view === "mine"
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() => setView("mine")}
          >
            My Tasks
          </button>
        </div>

        {canManage && (
          <>
            <h5 className="mb-3">Create Task</h5>

            <form className="row g-2" onSubmit={createTask}>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Task title"
                  value={form.title}
                  onChange={(e) =>
                    change("title", e.target.value)
                  }
                  disabled={saving}
                  required
                />
              </div>

              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    change("description", e.target.value)
                  }
                  disabled={saving}
                />
              </div>

              <div className="col-md-3">
                <select
                  className="form-select"
                  value={form.assignedToUserId}
                  onChange={(e) =>
                    change(
                      "assignedToUserId",
                      e.target.value
                    )
                  }
                  disabled={saving}
                  required
                >
                  <option value="">Assign to...</option>

                  {users.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name} — {item.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <input
                  type="date"
                  className="form-control"
                  value={form.dueDate}
                  onChange={(e) =>
                    change("dueDate", e.target.value)
                  }
                  disabled={saving}
                />
              </div>

              <div className="col-md-1">
                <button
                  className="btn btn-primary w-100"
                  disabled={saving}
                >
                  {saving ? "..." : "Add"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Task list */}
      <div className="bg-white rounded-4 shadow overflow-hidden mb-4">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            {view === "mine" ? "My Tasks" : "All Tasks"}
          </h5>

          <select
            className="form-select form-select-sm"
            style={{ width: "180px" }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>

            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-4 text-muted">
            Loading tasks...
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assigned To</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <strong>{task.title}</strong>

                      {task.description && (
                        <div className="small text-muted">
                          {task.description}
                        </div>
                      )}
                    </td>

                    <td>{task.assignedTo}</td>

                    <td>
                      {task.dueDate
                        ? new Date(
                            task.dueDate
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      <span className="badge text-bg-secondary">
                        {task.status}
                      </span>
                    </td>

                    <td>{task.createdBy}</td>

                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => openTask(task.id)}
                      >
                        Details
                      </button>

                      {canChangeStatus(task) && (
                        <select
                          className="form-select form-select-sm d-inline-block"
                          style={{ width: "130px" }}
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              updateStatus(
                                task,
                                e.target.value
                              );
                            }
                          }}
                        >
                          <option value="">Status</option>

                          {statuses.map((item) => (
                            <option
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          ))}
                        </select>
                      )}

                      {canManage && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger ms-1"
                          onClick={() => removeTask(task)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {!tasks.length && (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center text-muted py-4"
                    >
                      No tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task details */}
      {selected && (
        <div className="bg-white rounded-4 shadow p-3 p-md-4">
          <div className="d-flex justify-content-between mb-3">
            <div>
              <h5>Task #{selected.id}</h5>
              <div className="text-muted">
                {selected.title}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setSelected(null);
                setHistory([]);
              }}
            >
              Close
            </button>
          </div>

          <div className="row g-3 mb-4">
            <Info
              title="Status"
              value={selected.status}
            />

            <Info
              title="Assigned To"
              value={selected.assignedTo}
            />

            <Info
              title="Due Date"
              value={
                selected.dueDate
                  ? new Date(
                      selected.dueDate
                    ).toLocaleDateString()
                  : "No due date"
              }
            />

            <Info
              title="Created By"
              value={selected.createdBy}
            />
          </div>

          <div className="mb-4">
            <strong>Description</strong>
            <p className="mb-0">
              {selected.description || "No description."}
            </p>
          </div>

          <h5 className="mb-3">Task History</h5>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Old Status</th>
                  <th>New Status</th>
                  <th>Changed By</th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {new Date(
                        item.changedAt
                      ).toLocaleString()}
                    </td>

                    <td>{item.oldStatus}</td>
                    <td>{item.newStatus}</td>
                    <td>{item.changedBy}</td>
                  </tr>
                ))}

                {!history.length && (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center text-muted py-3"
                    >
                      No status history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function Info({ title, value }) {
  return (
    <div className="col-md-3">
      <strong>{title}</strong>
      <div>{value || "—"}</div>
    </div>
  );
}