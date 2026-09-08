import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  roleId: ""
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\d{10}$/;

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const STATUS_BADGE = {
  Pending: "badge-soft-warning",
  Deactivated: "badge-soft-danger",
  Approved: "badge-soft-success",
  Active: "badge-soft-primary",
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);

    try {
      const [usersData, rolesData] = await Promise.all([
        api.getUsers(),
        api.getRoles()
      ]);

      setUsers(usersData);

      setRoles(
        rolesData.filter(
          (role) => role.name !== "Unassigned"
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function startEdit(user) {
    setError("");
    setMessage("");

    setEditingId(user.id);

    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      roleId: user.roleId || ""
    });
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "Name is required.";
    }

    if (!emailPattern.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!phonePattern.test(form.phone)) {
      return "Phone number must be exactly 10 digits.";
    }

    if (!form.roleId) {
      return "Please select a role.";
    }

    if (!editingId && !form.password) {
      return "Password is required.";
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await api.updateUser(editingId, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone,
          roleId: Number(form.roleId)
        });

        setMessage("User updated successfully.");
      } else {
        await api.createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone,
          password: form.password,
          roleId: Number(form.roleId)
        });

        setMessage("User created successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(user) {
    setError("");
    setMessage("");

    try {
      const result = await api.approveUser(user.id);

      setMessage(
        result.message ||
          `${user.name} has been approved.`
      );

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleActive(user) {
    setError("");
    setMessage("");

    try {
      let result;

      if (user.status === "Deactivated") {
        result = await api.activateUser(user.id);
      } else {
        const confirmed = window.confirm(
          `Deactivate ${user.name}? They will not be able to log in.`
        );

        if (!confirmed) {
          return;
        }

        result = await api.deactivateUser(user.id);
      }

      setMessage(result.message);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(user) {
    setError("");
    setMessage("");

    const confirmed = window.confirm(
      `Delete ${user.name}? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const result = await api.deleteUser(user.id);

      setMessage(result.message);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !searchValue ||
        user.name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue) ||
        (user.phone || "").includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const pendingCount = users.filter(
    (user) => user.status === "Pending"
  ).length;

  return (
    <div className="dashboard-card user-management-card">
      <div className="user-management-header">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h5 className="mb-1">
              <i className="bi bi-people me-2"></i>
              User Management
            </h5>

            <div className="dashboard-muted small">
              Manage users, approval, roles and account status.
            </div>
          </div>

          {pendingCount > 0 && (
            <span className="badge-soft badge-soft-warning">
              <i className="bi bi-hourglass-split"></i>
              {pendingCount} pending approval
              {pendingCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <form
          className="row g-2 mt-3"
          onSubmit={handleSubmit}
        >
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Name"
              value={form.name}
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value
                )
              }
              disabled={saving}
              required
            />
          </div>

          <div className="col-md-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={form.email}
              onChange={(event) =>
                updateField(
                  "email",
                  event.target.value
                )
              }
              disabled={saving}
              required
            />
          </div>

          <div className="col-md-2">
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className="form-control"
              placeholder="Phone"
              value={form.phone}
              onChange={(event) =>
                updateField(
                  "phone",
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10)
                )
              }
              disabled={saving}
              required
            />
          </div>

          {!editingId && (
            <div className="col-md-2">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={form.password}
                onChange={(event) =>
                  updateField(
                    "password",
                    event.target.value
                  )
                }
                disabled={saving}
                required
              />
            </div>
          )}

          <div className="col-md-2">
            <select
              className="form-select"
              value={form.roleId}
              onChange={(event) =>
                updateField(
                  "roleId",
                  event.target.value
                )
              }
              disabled={saving}
              required
            >
              <option value="" disabled>
                Select role...
              </option>

              {roles.map((role) => (
                <option
                  key={role.id}
                  value={role.id}
                >
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Save Changes"
                : "Add User"}
            </button>
          </div>

          {editingId && (
            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          )}
        </form>

        {error && (
          <div className="alert alert-danger mt-3 mb-0">
            {error}
          </div>
        )}

        {message && (
          <div className="alert alert-success mt-3 mb-0">
            {message}
          </div>
        )}

        <div className="row g-2 mt-3">
          <div className="col-md-8">
            <input
              className="form-control"
              placeholder="Search name, email or phone..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="col-md-2">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Active">Active</option>
              <option value="Deactivated">
                Deactivated
              </option>
            </select>
          </div>

          <div className="col-md-2">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={loadData}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="user-management-table">
        {loading ? (
          <div className="dashboard-loading py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="dashboard-empty py-5">
            No users found.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table dashboard-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="fw-semibold">
                      <div className="user-management-name-cell">
                        <span className="app-avatar app-avatar-table">
                          {getInitials(user.name)}
                        </span>
                        {user.name}
                      </div>
                    </td>

                    <td>{user.email}</td>

                    <td>{user.phone || "-"}</td>

                    <td>
                      {user.roleName ||
                        user.role?.name ||
                        user.role ||
                        "Unassigned"}
                    </td>

                    <td>
                      <span
                        className={`badge-soft ${
                          STATUS_BADGE[user.status] || "badge-soft-neutral"
                        }`}
                      >
                        <span className="badge-soft-dot"></span>
                        {user.status}
                      </span>
                    </td>

                    <td>
                      <div className="d-flex justify-content-end gap-1">
                        {user.status === "Pending" && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() =>
                              handleApprove(user)
                            }
                          >
                            Approve
                          </button>
                        )}

                        {user.status !== "Pending" && (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() =>
                              handleToggleActive(user)
                            }
                          >
                            {user.status === "Deactivated"
                              ? "Activate"
                              : "Deactivate"}
                          </button>
                        )}

                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() =>
                            startEdit(user)
                          }
                        >
                          <i className="bi bi-pencil"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            handleDelete(user)
                          }
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}