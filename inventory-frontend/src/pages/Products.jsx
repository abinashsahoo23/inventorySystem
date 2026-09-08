import { useEffect, useState } from "react";
import { api } from "../api";
import { getCurrentUser } from "../components/auth/session";

const emptyForm = {
  name: "",
  sku: "",
  description: "",
  categoryId: "",
  brandId: "",
  purchasePrice: "",
  sellingPrice: "",
  minimumStockLevel: 0,
  isActive: true,
};

export default function Products() {
  const user = getCurrentUser();
  const canManage =
    user?.role === "SuperAdmin" ||
    user?.role === "InventoryManager";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [products, categories, brands] =
        await Promise.all([
          api.getProducts(),
          api.getCategories(),
          api.getBrands(),
        ]);

      setProducts(products);
      setCategories(categories.filter((x) => x.isActive));
      setBrands(brands.filter((x) => x.isActive));
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

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function edit(product) {
    setError("");
    setMessage("");

    setEditingId(product.id);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      categoryId: product.categoryId || "",
      brandId: product.brandId || "",
      purchasePrice: product.purchasePrice ?? "",
      sellingPrice:
        product.sellingPrice ??
        product.price ??
        "",
      minimumStockLevel:
        product.minimumStockLevel ?? 0,
      isActive: product.isActive ?? true,
    });
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!canManage) {
      setError("You do not have access to manage products.");
      return;
    }

    const purchasePrice = Number(form.purchasePrice) || 0;
    const sellingPrice = Number(form.sellingPrice) || 0;
    const minimumStock = Number(form.minimumStockLevel) || 0;

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (purchasePrice < 0 || sellingPrice < 0) {
      setError("Prices cannot be negative.");
      return;
    }

    if (purchasePrice > sellingPrice) {
      setError(
        "Selling price should not be lower than purchase price."
      );
      return;
    }

    if (minimumStock < 0) {
      setError("Minimum stock level cannot be negative.");
      return;
    }

    const data = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      description: form.description.trim(),
      categoryId: form.categoryId
        ? Number(form.categoryId)
        : null,
      brandId: form.brandId
        ? Number(form.brandId)
        : null,
      purchasePrice,
      sellingPrice,
      minimumStockLevel: minimumStock,
      isActive: form.isActive,
    };

    setSaving(true);

    try {
      if (editingId) {
        await api.updateProduct(editingId, data);
        setMessage("Product updated successfully.");
      } else {
        await api.addProduct(data);
        setMessage("Product added successfully.");
      }

      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function importProducts(event) {
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
      const result = await api.bulkImportProducts(file);
      setMessage(result.message);
      await load();
    } catch (err) {
      setError(err.message);
      setImportErrors(err.details || []);
    } finally {
      setImporting(false);
    }
  }

  async function toggle(product) {
    if (!canManage) return;

    setError("");
    setMessage("");

    try {
      if (product.isActive) {
        await api.deactivateProduct(product.id);
        setMessage(`${product.name} deactivated.`);
      } else {
        await api.activateProduct(product.id);
        setMessage(`${product.name} activated.`);
      }

      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(product) {
    if (!canManage) return;

    if (!window.confirm(`Delete ${product.name}?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const result = await api.deleteProduct(product.id);
      setMessage(result.message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredProducts = products.filter((product) => {
    const text = search.trim().toLowerCase();

    const matchesSearch =
      !text ||
      product.name.toLowerCase().includes(text) ||
      (product.sku || "").toLowerCase().includes(text);

    const matchesCategory =
      !categoryFilter ||
      String(product.categoryId) === String(categoryFilter);

    const matchesBrand =
      !brandFilter ||
      String(product.brandId) === String(brandFilter);

    const matchesActive =
      showInactive || product.isActive;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesBrand &&
      matchesActive
    );
  });

  return (
    <>
      {/* Product form */}
      <div className="mb-4">
        <h3 className="mb-1">Products</h3>
        <div className="text-muted">
          Manage products, SKU, pricing and stock settings.
        </div>
      </div>

      {canManage && (
        <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
          <h5 className="mb-3">
            {editingId ? "Edit Product" : "Add Product"}
          </h5>

          <form onSubmit={save}>
            <div className="row g-2">
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Product name"
                  value={form.name}
                  onChange={(e) => change("name", e.target.value)}
                  disabled={saving}
                  required
                />
              </div>

              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="SKU"
                  value={form.sku}
                  onChange={(e) => change("sku", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="col-md-3">
                <select
                  className="form-select"
                  value={form.categoryId}
                  onChange={(e) =>
                    change("categoryId", e.target.value)
                  }
                  disabled={saving}
                >
                  <option value="">Category</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <select
                  className="form-select"
                  value={form.brandId}
                  onChange={(e) =>
                    change("brandId", e.target.value)
                  }
                  disabled={saving}
                >
                  <option value="">Brand</option>
                  {brands.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    change("description", e.target.value)
                  }
                  disabled={saving}
                />
              </div>

              <div className="col-md-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  placeholder="Purchase price"
                  value={form.purchasePrice}
                  onChange={(e) =>
                    change("purchasePrice", e.target.value)
                  }
                  disabled={saving}
                  required
                />
              </div>

              <div className="col-md-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  placeholder="Selling price"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    change("sellingPrice", e.target.value)
                  }
                  disabled={saving}
                  required
                />
              </div>

              <div className="col-md-2">
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="Min stock"
                  value={form.minimumStockLevel}
                  onChange={(e) =>
                    change(
                      "minimumStockLevel",
                      e.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>

              <div className="col-md-2">
                <div className="form-check mt-2">
                  <input
                    id="product-active"
                    className="form-check-input"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      change("isActive", e.target.checked)
                    }
                    disabled={saving}
                  />

                  <label
                    htmlFor="product-active"
                    className="form-check-label"
                  >
                    Active
                  </label>
                </div>
              </div>

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
                <div className="col-md-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={reset}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {canManage && (
        <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <h5 className="mb-1">Bulk Import Products</h5>
              <div className="text-muted small">
                Upload an .xlsx file and add multiple products at once.
              </div>
            </div>

            <div>
              <label className="btn btn-outline-primary mb-0">
                {importing ? "Importing..." : "Choose Excel File"}
                <input
                  type="file"
                  accept=".xlsx"
                  className="d-none"
                  onChange={importProducts}
                  disabled={importing}
                />
              </label>
            </div>
          </div>

          <div className="small text-muted mt-3">
            Required columns: Name, SKU, Description, Category, Brand,
            PurchasePrice, SellingPrice, MinimumStockLevel, IsActive
          </div>
        </div>
      )}

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

      {/* Filters */}
      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-3">
        <div className="row g-2">
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Search product or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <select
              className="form-select"
              value={brandFilter}
              onChange={(e) =>
                setBrandFilter(e.target.value)
              }
            >
              <option value="">All brands</option>
              {brands.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <div className="form-check mt-2">
              <input
                id="show-inactive"
                className="form-check-input"
                type="checkbox"
                checked={showInactive}
                onChange={(e) =>
                  setShowInactive(e.target.checked)
                }
              />

              <label
                htmlFor="show-inactive"
                className="form-check-label"
              >
                Show inactive
              </label>
            </div>
          </div>

          <div className="col-md-1">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={load}
              disabled={loading}
            >
              ↻
            </button>
          </div>
        </div>
      </div>

      {/* Product table */}
      <div className="bg-white rounded-4 shadow overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Purchase</th>
                <th>Selling</th>
                <th>Min Stock</th>
                <th>Stock</th>
                <th>Status</th>
                {canManage && <th className="text-end">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={canManage ? 10 : 9}
                    className="text-center text-muted py-4"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 10 : 9}
                    className="text-center text-muted py-4"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const lowStock =
                    product.totalStock <=
                    product.minimumStockLevel;

                  return (
                    <tr key={product.id}>
                      <td>{product.name}</td>

                      <td>{product.sku || "—"}</td>

                      <td>{product.category || "—"}</td>

                      <td>{product.brand || "—"}</td>

                      <td>
                        ₹
                        {Number(
                          product.purchasePrice || 0
                        ).toLocaleString("en-IN")}
                      </td>

                      <td>
                        ₹
                        {Number(
                          product.sellingPrice ??
                            product.price ??
                            0
                        ).toLocaleString("en-IN")}
                      </td>

                      <td>{product.minimumStockLevel}</td>

                      <td
                        className={
                          lowStock
                            ? "text-danger fw-semibold"
                            : ""
                        }
                      >
                        {product.totalStock}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            product.isActive
                              ? "text-bg-success"
                              : "text-bg-secondary"
                          }`}
                        >
                          {product.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {canManage && (
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => edit(product)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={`btn btn-sm me-1 ${
                              product.isActive
                                ? "btn-outline-warning"
                                : "btn-outline-success"
                            }`}
                            onClick={() => toggle(product)}
                          >
                            {product.isActive
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => remove(product)}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}