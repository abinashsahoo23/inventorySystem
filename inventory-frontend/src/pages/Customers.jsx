import { useEffect, useState } from "react";
import { api } from "../api";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");

    try {
      setCustomers(await api.getCustomers());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function change(field, value) {
    setForm((form) => ({
      ...form,
      [field]: value,
    }));
  }

  async function save(e) {
    e.preventDefault();
    setError("");

    const data = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };

    if (!data.name) {
      setError("Customer name is required.");
      return;
    }

    if (data.email && !emailRegex.test(data.email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (data.phone && !/^\d{10}$/.test(data.phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    try {
      if (editingId) {
        await api.updateCustomer(editingId, data);
      } else {
        await api.addCustomer(data);
      }

      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
  }

  function cancel() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function remove(id) {
    if (!window.confirm("Delete this customer?")) return;

    try {
      await api.deleteCustomer(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h3 className="mb-4">Customers</h3>

      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <form className="row g-2" onSubmit={save}>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Customer name"
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
              required
            />
          </div>

          <div className="col-md-3">
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className="form-control"
              placeholder="Phone (10 digits)"
              value={form.phone}
              onChange={(e) =>
                change(
                  "phone",
                  e.target.value.replace(/\D/g, "").slice(0, 10)
                )
              }
            />
          </div>

          <div className="col-md-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={form.email}
              onChange={(e) => change("email", e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <button
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {editingId ? "Update" : "Add"}
            </button>
          </div>

          <div className="col-12">
            <input
              className="form-control"
              placeholder="Address"
              value={form.address}
              onChange={(e) => change("address", e.target.value)}
            />
          </div>

          {editingId && (
            <div className="col-12">
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={cancel}
              >
                Cancel edit
              </button>
            </div>
          )}
        </form>

        {error && (
          <div className="alert alert-danger py-2 mt-2 mb-0">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-4 shadow overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.phone || "—"}</td>
                  <td>{customer.email || "—"}</td>
                  <td>{customer.address || "—"}</td>

                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() => edit(customer)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => remove(customer.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No customers yet.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}