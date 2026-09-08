import { useEffect, useState } from "react";
import { api } from "../api";

const emptyForm = {
  name: "",
  location: "",
};

const STATUS_BADGE = {
  active: "badge-soft-success",
  inactive: "badge-soft-neutral",
};

function getStatusBadge(isActive) {
  return isActive ? STATUS_BADGE.active : STATUS_BADGE.inactive;
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [stock, setStock] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [employeeId, setEmployeeId] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadWarehouses() {
    setLoading(true);
    setError("");

    try {
      const [warehouseData, userData, stockData] = await Promise.all([
        api.getWarehouses(),
        api.getUsers(),
        api.getStock(),
      ]);

      // Keep both active and inactive warehouses visible so the admin
      // can manage old records instead of losing them from the UI.
      setWarehouses(warehouseData);
      setStock(stockData);

      setUsers(
        userData.filter(
          (user) =>
            user.status !== "Deactivated" &&
            (user.role === "WarehouseManager" ||
              user.role === "Staff")
        )
      );
    } catch (err) {
      setError(err.message || "Failed to load warehouses.");
    } finally {
      setLoading(false);
    }
  }

  async function loadWarehouseDetails(warehouseId) {
    if (!warehouseId) {
      setEmployees([]);
      return;
    }

    try {
      const employeeData = await api.getWarehouseEmployees(warehouseId);
      setEmployees(employeeData);
    } catch (err) {
      setError(err.message || "Failed to load warehouse details.");
    }
  }

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    loadWarehouseDetails(selectedId);
  }, [selectedId]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(warehouse) {
    setError("");
    setMessage("");
    setEditingId(warehouse.id);
    setForm({
      name: warehouse.name || "",
      location: warehouse.location || "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const name = form.name.trim();
    const location = form.location.trim();

    if (!name) {
      setError("Warehouse name is required.");
      return;
    }

    setSaving(true);

    try {
      const result = editingId
        ? await api.updateWarehouse(editingId, { name, location })
        : await api.addWarehouse({ name, location });

      setMessage(
        result.message ||
          (editingId
            ? "Warehouse updated successfully."
            : "Warehouse added successfully.")
      );

      const currentEditingId = editingId;
      resetForm();
      await loadWarehouses();

      if (currentEditingId) {
        setSelectedId(currentEditingId);
      }
    } catch (err) {
      setError(err.message || "Could not save warehouse.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(warehouse) {
    setError("");
    setMessage("");
    setActionId(warehouse.id);

    try {
      const result = warehouse.isActive
        ? await api.deactivateWarehouse(warehouse.id)
        : await api.activateWarehouse(warehouse.id);

      setMessage(result.message);
      await loadWarehouses();
    } catch (err) {
      setError(err.message || "Could not change warehouse status.");
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(warehouse) {
    setError("");
    setMessage("");

    const confirmed = window.confirm(
      `Delete ${warehouse.name}? This cannot be undone.\n\n` +
        "Warehouses with stock or assigned employees cannot be deleted; deactivate them instead."
    );

    if (!confirmed) {
      return;
    }

    setActionId(warehouse.id);

    try {
      const result = await api.deleteWarehouse(warehouse.id);

      setMessage(result.message);

      if (selectedId === warehouse.id) {
        setSelectedId(null);
        setEmployees([]);
      }

      if (editingId === warehouse.id) {
        resetForm();
      }

      await loadWarehouses();
    } catch (err) {
      setError(err.message || "Could not delete warehouse.");
    } finally {
      setActionId(null);
    }
  }

  async function assignEmployee(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!selectedId || !employeeId) {
      setError("Select a warehouse and employee.");
      return;
    }

    try {
      const result = await api.assignWarehouseEmployee(
        selectedId,
        Number(employeeId)
      );

      setMessage(result.message);
      setEmployeeId("");

      await loadWarehouseDetails(selectedId);
      await loadWarehouses();
    } catch (err) {
      setError(err.message || "Could not assign employee.");
    }
  }

  async function removeEmployee(userId) {
    if (
      !window.confirm(
        "Remove this employee from the warehouse?"
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const result = await api.removeWarehouseEmployee(
        selectedId,
        userId
      );

      setMessage(result.message);

      await loadWarehouseDetails(selectedId);
      await loadWarehouses();
    } catch (err) {
      setError(err.message || "Could not remove employee.");
    }
  }

  const selectedWarehouse = warehouses.find(
    (warehouse) => warehouse.id === selectedId
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-border text-primary"></div>
        <span>Loading warehouses...</span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h3>Warehouses</h3>
        <p className="text-muted mb-0">
          Manage warehouses, stock and assigned employees.
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

      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h5 className="mb-0">
            {editingId ? "Edit Warehouse" : "Add Warehouse"}
          </h5>

          {editingId && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>

        <form className="row g-2" onSubmit={handleSubmit}>
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Warehouse name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              disabled={saving}
              required
            />
          </div>

          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Location"
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              disabled={saving}
            />
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
                : "Add"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-4 shadow overflow-hidden mb-4">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <strong>Warehouses</strong>
          <span className="dashboard-muted small">
            {warehouses.length} total
          </span>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Employees</th>
                <th>Warehouse Stock</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {warehouses.map((warehouse) => {
                const busy = actionId === warehouse.id;

                return (
                  <tr
                    key={warehouse.id}
                    className={
                      selectedId === warehouse.id
                        ? "table-primary"
                        : ""
                    }
                  >
                    <td className="fw-semibold">
                      {warehouse.name}
                    </td>

                    <td>{warehouse.location || "—"}</td>

                    <td>{warehouse.employeeCount ?? 0}</td>

                    <td>
                      <strong>
                        {Number(warehouse.totalStock || 0).toLocaleString()}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`badge-soft ${getStatusBadge(
                          warehouse.isActive
                        )}`}
                      >
                        <span className="badge-soft-dot"></span>
                        {warehouse.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="d-flex justify-content-end gap-1 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setSelectedId(warehouse.id)}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => handleToggleActive(warehouse)}
                          disabled={busy}
                        >
                          {warehouse.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => startEdit(warehouse)}
                          disabled={busy}
                          title={`Edit ${warehouse.name}`}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(warehouse)}
                          disabled={busy}
                          title={`Delete ${warehouse.name}`}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {warehouses.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center text-muted py-4"
                  >
                    No warehouses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h5 className="mb-1">Warehouse Stock</h5>
            <div className="dashboard-muted small">
              Current stock across all warehouses.
            </div>
          </div>

          <span className="dashboard-muted small">
            {stock.length} stock {stock.length === 1 ? "row" : "rows"}
          </span>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Warehouse</th>
                <th>Quantity</th>
              </tr>
            </thead>

            <tbody>
              {stock.map((item) => (
                <tr key={`${item.productId}-${item.warehouseId}`}>
                  <td>{item.productName}</td>
                  <td>{item.sku || "—"}</td>
                  <td>{item.warehouseName}</td>
                  <td>{Number(item.quantity || 0).toLocaleString()}</td>
                </tr>
              ))}

              {!stock.length && (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center text-muted py-4"
                  >
                    No stock rows yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedWarehouse && (
        <div className="bg-white rounded-4 shadow p-3 p-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h5 className="mb-1">Warehouse Employees</h5>
              <div className="dashboard-muted small">
                {selectedWarehouse.name}
              </div>
            </div>
          </div>

          <form className="row g-2 mb-3" onSubmit={assignEmployee}>
            <div className="col-md-9">
              <select
                className="form-select"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
              >
                <option value="">Select employee</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={!selectedWarehouse.isActive}
              >
                Assign
              </button>
            </div>
          </form>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="fw-semibold">{employee.name}</td>
                    <td>{employee.email}</td>
                    <td>{employee.role}</td>
                    <td>{employee.status}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeEmployee(employee.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}

                {employees.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center text-muted py-4"
                    >
                      No employees assigned to this warehouse.
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
