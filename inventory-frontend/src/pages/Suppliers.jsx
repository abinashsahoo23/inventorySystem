import { useEffect, useState } from "react";
import { api } from "../api";

const emptyForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setSuppliers(
        await api.getSuppliers(
          search,
          !showInactive
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [showInactive]);

  function change(field, value) {
    setForm((form) => ({
      ...form,
      [field]: value,
    }));
  }

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function edit(supplier) {
    setEditingId(supplier.id);

    setForm({
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });

    setError("");
    setMessage("");
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    if (form.email && !emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const data = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };

    setSaving(true);

    try {
      if (editingId) {
        await api.updateSupplier(editingId, data);
        setMessage("Supplier updated successfully.");
      } else {
        await api.addSupplier(data);
        setMessage("Supplier added successfully.");
      }

      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(supplier) {
    setError("");
    setMessage("");

    try {
      if (supplier.isActive) {
        await api.deactivateSupplier(supplier.id);
        setMessage(`${supplier.name} deactivated.`);
      } else {
        await api.activateSupplier(supplier.id);
        setMessage(`${supplier.name} activated.`);
      }

      await load();

      if (selected?.id === supplier.id) {
        await openSupplier(supplier.id);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(supplier) {
    if (!window.confirm(`Delete ${supplier.name}?`)) return;

    setError("");
    setMessage("");

    try {
      const result = await api.deleteSupplier(supplier.id);

      setMessage(result.message);
      setSelected(null);
      setHistory([]);

      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function openSupplier(id) {
    setError("");

    try {
      const [supplier, purchaseHistory] =
        await Promise.all([
          api.getSupplier(id),
          api.getSupplierHistory(id),
        ]);

      setSelected(supplier);
      setHistory(purchaseHistory);
    } catch (err) {
      setError(err.message);
    }
  }

  async function searchSuppliers(event) {
    event.preventDefault();
    await load();
  }

  return (
    <>
      <div className="mb-4">
        <h3>Suppliers</h3>
        <p className="text-muted mb-0">
          Manage suppliers and review purchase history.
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

      {/* Add / Edit */}
      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <h5 className="mb-3">
          {editingId ? "Edit Supplier" : "Add Supplier"}
        </h5>

        <form className="row g-2" onSubmit={save}>
          {[
            ["name", "Supplier name", "col-md-4"],
            ["contactPerson", "Contact person", "col-md-4"],
            ["phone", "Phone", "col-md-4"],
            ["email", "Email", "col-md-4"],
            ["address", "Address", "col-md-6"],
          ].map(([field, placeholder, size]) => (
            <div className={size} key={field}>
              <input
                className="form-control"
                type={
                  field === "email"
                    ? "email"
                    : field === "phone"
                    ? "tel"
                    : "text"
                }
                inputMode={
                  field === "phone"
                    ? "numeric"
                    : undefined
                }
                maxLength={
                  field === "phone"
                    ? 10
                    : undefined
                }
                placeholder={placeholder}
                value={form[field]}
                onChange={(event) =>
                  change(
                    field,
                    field === "phone"
                      ? event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10)
                      : event.target.value
                  )
                }
                disabled={saving}
                required={field === "name"}
              />
            </div>
          ))}

          <div className="col-md-2">
            <button
              className="btn btn-primary w-100"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Save"
                : "Add"}
            </button>
          </div>

          {editingId && (
            <div className="col-12">
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={reset}
                disabled={saving}
              >
                Cancel edit
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Search */}
      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <form
          className="row g-2 align-items-center"
          onSubmit={searchSuppliers}
        >
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Search supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <button className="btn btn-outline-primary w-100">
              Search
            </button>
          </div>

          <div className="col-md-4">
            <div className="form-check">
              <input
                id="show-inactive-suppliers"
                className="form-check-input"
                type="checkbox"
                checked={showInactive}
                onChange={(e) =>
                  setShowInactive(e.target.checked)
                }
              />

              <label
                htmlFor="show-inactive-suppliers"
                className="form-check-label"
              >
                Show inactive suppliers
              </label>
            </div>
          </div>
        </form>
      </div>

      {/* Supplier table */}
      <div className="bg-white rounded-4 shadow overflow-hidden mb-4">
        <div className="p-3 border-bottom">
          <strong>Suppliers</strong>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Purchases</th>
                <th>Total</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center text-muted py-4"
                  >
                    Loading...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center text-muted py-4"
                  >
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.name}</td>

                    <td>{supplier.contactPerson || "—"}</td>

                    <td>{supplier.phone || "—"}</td>

                    <td>{supplier.email || "—"}</td>

                    <td>{supplier.purchaseCount}</td>

                    <td>
                      ₹
                      {Number(
                        supplier.totalPurchaseAmount || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          supplier.isActive
                            ? "text-bg-success"
                            : "text-bg-secondary"
                        }`}
                      >
                        {supplier.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() =>
                          openSupplier(supplier.id)
                        }
                      >
                        Details
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => edit(supplier)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className={`btn btn-sm me-1 ${
                          supplier.isActive
                            ? "btn-outline-warning"
                            : "btn-outline-success"
                        }`}
                        onClick={() =>
                          toggleStatus(supplier)
                        }
                      >
                        {supplier.isActive
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => remove(supplier)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details */}
      {selected && (
        <div className="bg-white rounded-4 shadow p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 className="mb-1">
                {selected.name}
              </h5>
              <div className="text-muted">
                Supplier details
              </div>
            </div>

            <span
              className={`badge ${
                selected.isActive
                  ? "text-bg-success"
                  : "text-bg-secondary"
              }`}
            >
              {selected.isActive
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          <div className="row g-3 mb-4">
            <Info
              title="Contact"
              value={selected.contactPerson}
            />

            <Info
              title="Phone"
              value={selected.phone}
            />

            <Info
              title="Email"
              value={selected.email}
            />

            <Info
              title="Address"
              value={selected.address}
            />

            <Info
              title="Purchase Orders"
              value={selected.purchaseCount}
            />

            <Info
              title="Total Purchases"
              value={`₹${Number(
                selected.totalPurchaseAmount || 0
              ).toLocaleString("en-IN")}`}
            />
          </div>

          <h5 className="mb-3">
            Purchase History
          </h5>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>PO</th>
                  <th>Date</th>
                  <th>Warehouse</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created By</th>
                </tr>
              </thead>

              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center text-muted py-3"
                    >
                      No purchase history for this supplier.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr
                      key={item.purchaseOrderId}
                    >
                      <td>
                        #{item.purchaseOrderId}
                      </td>

                      <td>
                        {new Date(
                          item.orderDate
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        {item.warehouseName}
                      </td>

                      <td>
                        {item.itemCount}
                      </td>

                      <td>
                        ₹
                        {Number(
                          item.totalAmount
                        ).toLocaleString("en-IN")}
                      </td>

                      <td>{item.status}</td>

                      <td>{item.createdBy}</td>
                    </tr>
                  ))
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