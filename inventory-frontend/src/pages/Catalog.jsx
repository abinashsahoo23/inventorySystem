import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

const emptyForm = {
  name: "",
};

export default function Catalog() {
  const [tab, setTab] = useState("categories");

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [categoriesData, brandsData] =
        await Promise.all([
          api.getCategories(),
          api.getBrands(),
        ]);

      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const items =
    tab === "categories"
      ? categories
      : brands;

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return items;
    }

    return items.filter((item) =>
      item.name.toLowerCase().includes(value)
    );
  }, [items, search]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function switchTab(value) {
    setTab(value);
    setSearch("");
    setMessage("");
    setError("");
    setImportErrors([]);
    resetForm();
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
    });

    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const name = form.name.trim();

    if (!name) {
      setError(
        `${tab === "categories" ? "Category" : "Brand"} name is required.`
      );
      return;
    }

    setSaving(true);

    try {
      if (tab === "categories") {
        if (editingId) {
          await api.updateCategory(
            editingId,
            { name }
          );

          setMessage(
            "Category updated successfully."
          );
        } else {
          await api.addCategory({ name });

          setMessage(
            "Category added successfully."
          );
        }
      } else {
        if (editingId) {
          await api.updateBrand(
            editingId,
            { name }
          );

          setMessage(
            "Brand updated successfully."
          );
        } else {
          await api.addBrand({ name });

          setMessage(
            "Brand added successfully."
          );
        }
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function importItems(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");
    setMessage("");
    setImportErrors([]);

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Please select an Excel .xlsx file.");
      return;
    }

    setImporting(true);

    try {
      const result =
        tab === "categories"
          ? await api.bulkImportCategories(file)
          : await api.bulkImportBrands(file);

      setMessage(result.message);
      await loadData();
    } catch (err) {
      setError(err.message);
      setImportErrors(err.details || []);
    } finally {
      setImporting(false);
    }
  }

  async function toggleActive(item) {
    setError("");
    setMessage("");

    try {
      if (tab === "categories") {
        if (item.isActive) {
          await api.deactivateCategory(item.id);
          setMessage(
            `${item.name} deactivated.`
          );
        } else {
          await api.activateCategory(item.id);
          setMessage(
            `${item.name} activated.`
          );
        }
      } else {
        if (item.isActive) {
          await api.deactivateBrand(item.id);
          setMessage(
            `${item.name} deactivated.`
          );
        } else {
          await api.activateBrand(item.id);
          setMessage(
            `${item.name} activated.`
          );
        }
      }

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="mb-4">
        <h3 className="mb-1">
          Categories & Brands
        </h3>

        <div className="text-muted">
          Manage the product catalog.
        </div>
      </div>

      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <div className="d-flex gap-2 mb-3">
          <button
            type="button"
            className={`btn ${
              tab === "categories"
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() =>
              switchTab("categories")
            }
          >
            Categories
          </button>

          <button
            type="button"
            className={`btn ${
              tab === "brands"
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() =>
              switchTab("brands")
            }
          >
            Brands
          </button>
        </div>

        <form
          className="row g-2"
          onSubmit={handleSubmit}
        >
          <div className="col-md-8">
            <input
              className="form-control"
              placeholder={
                tab === "categories"
                  ? "Category name"
                  : "Brand name"
              }
              value={form.name}
              onChange={(event) =>
                setForm({
                  name: event.target.value,
                })
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
                ? "Save"
                : "Add"}
            </button>
          </div>

          <div className="col-md-2">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={resetForm}
              disabled={saving}
            >
              Clear
            </button>
          </div>
        </form>

        {editingId && (
          <div className="small text-muted mt-2">
            Editing existing{" "}
            {tab === "categories"
              ? "category"
              : "brand"}
            .
          </div>
        )}

        {message && (
          <div className="alert alert-success py-2 mt-3 mb-0">
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-2 mt-3 mb-0">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h5 className="mb-1">
              Bulk Import{" "}
              {tab === "categories" ? "Categories" : "Brands"}
            </h5>
            <div className="text-muted small">
              Upload an .xlsx file and add multiple{" "}
              {tab === "categories" ? "categories" : "brands"} at once.
            </div>
          </div>

          <div>
            <label className="btn btn-outline-primary mb-0">
              {importing ? "Importing..." : "Choose Excel File"}
              <input
                type="file"
                accept=".xlsx"
                className="d-none"
                onChange={importItems}
                disabled={importing}
              />
            </label>
          </div>
        </div>

        <div className="small text-muted mt-3">
          Required columns: Name.
        </div>
      </div>

      {importErrors.length > 0 && (
        <div className="alert alert-danger py-2">
          <strong>Please fix these Excel rows:</strong>
          <div className="mt-2">
            {importErrors.map((item, index) => (
              <div key={`${item.row}-${index}`}>
                Row {item.row}: {item.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-4 shadow p-3 p-md-4">
        <div className="row g-2 mb-3">
          <div className="col-md-8">
            <input
              className="form-control"
              placeholder={`Search ${
                tab === "categories"
                  ? "categories"
                  : "brands"
              }...`}
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="col-md-4">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-muted py-3">
            Loading...
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Products</th>
                  <th className="text-end">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>

                    <td>
                      <span
                        className={`badge ${
                          item.isActive
                            ? "text-bg-success"
                            : "text-bg-secondary"
                        }`}
                      >
                        {item.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      {item.productCount ?? 0}
                    </td>

                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() =>
                          startEdit(item)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className={`btn btn-sm ${
                          item.isActive
                            ? "btn-outline-warning"
                            : "btn-outline-success"
                        }`}
                        onClick={() =>
                          toggleActive(item)
                        }
                      >
                        {item.isActive
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center text-muted py-4"
                    >
                      No{" "}
                      {tab === "categories"
                        ? "categories"
                        : "brands"}{" "}
                      found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}