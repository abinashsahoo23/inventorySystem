import { useEffect, useState } from "react";
import { api } from "../api";
import { getCurrentUser } from "./auth/session";

const emptyForm = {
  name: "",
  categoryId: "",
  price: "",
};

function canManageProducts(role) {
  return role === "SuperAdmin" || role === "InventoryManager";
}

export default function ProductTable() {
  const user = getCurrentUser();
  const canManage = canManageProducts(user?.role);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProduct, setEditingProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [productsData, categoriesData] = await Promise.all([
        api.getProducts(undefined, undefined, undefined, true),
        api.getCategories(),
      ]);

      setProducts(productsData);
      setCategories(categoriesData.filter((category) => category.isActive));
    } catch (err) {
      setError(err.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [productsData, categoriesData] = await Promise.all([
          api.getProducts(undefined, undefined, undefined, true),
          api.getCategories(),
        ]);

        if (!mounted) return;

        setProducts(productsData);
        setCategories(
          categoriesData.filter((category) => category.isActive)
        );
        setError("");
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Unable to load products.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingProduct(null);
  }

  function startEdit(product) {
    if (!canManage) return;

    setError("");
    setMessage("");
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      categoryId: product.categoryId ? String(product.categoryId) : "",
      price: product.sellingPrice ?? product.price ?? "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canManage || saving) return;

    setError("");
    setMessage("");

    const name = form.name.trim();
    const sellingPrice = Number(form.price);

    if (!name) {
      setError("Product name is required.");
      return;
    }

    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      setError("Price must be a valid non-negative number.");
      return;
    }

    setSaving(true);

    try {
      if (editingProduct) {
        const result = await api.updateProduct(editingProduct.id, {
          name,
          sku: editingProduct.sku || null,
          description: editingProduct.description || "",
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          brandId: editingProduct.brandId || null,
          purchasePrice: Number(editingProduct.purchasePrice) || 0,
          sellingPrice,
          minimumStockLevel: Number(editingProduct.minimumStockLevel) || 0,
          isActive: editingProduct.isActive ?? true,
        });

        setMessage(result?.message || `${name} updated successfully.`);
      } else {
        const result = await api.addProduct({
          name,
          sku: null,
          description: "",
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          brandId: null,
          purchasePrice: 0,
          sellingPrice,
          minimumStockLevel: 0,
        });

        setMessage(result?.message || `${name} added successfully.`);
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save the product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!canManage || saving) return;

    const confirmed = window.confirm(
      `Remove ${product.name}? Products with inventory or transaction history will be deactivated instead of permanently deleted.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const result = await api.deleteProduct(product.id);
      setMessage(result?.message || `${product.name} removed.`);
      await loadData();
    } catch (err) {
      setError(err.message || `Unable to remove ${product.name}.`);
    } finally {
      setSaving(false);
    }
  }

  const totalProducts = products.length;
  const lowStockItems = products.filter(
    (product) => product.totalStock < 5
  );
  const totalValue = products.reduce(
    (sum, product) =>
      sum + Number(product.totalStock || 0) * Number(product.price || 0),
    0
  );

  return (
    <div className="bg-white rounded-4 shadow overflow-hidden mb-4 user-dashboard-surface">
      <div className="p-3 p-md-4">
        {message && (
          <div className="alert alert-success" role="status">
            <i className="bi bi-check-circle me-2"></i>
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {lowStockItems.length > 0 && (
          <div className="alert alert-warning d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {lowStockItems.length} product
            {lowStockItems.length > 1 ? "s are" : " is"} running low on stock.
          </div>
        )}

        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-4">
            <div className="card border-start border-4 h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="icon-square bg-dark text-white d-flex align-items-center justify-content-center flex-shrink-0">
                  <i className="bi bi-box-seam"></i>
                </div>
                <div>
                  <div className="text-muted small">Total Products</div>
                  <div className="fs-4 fw-bold">{totalProducts}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-4">
            <div className="card border-start border-4 border-warning h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="icon-square bg-warning text-white d-flex align-items-center justify-content-center flex-shrink-0">
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
                <div>
                  <div className="text-muted small">Low Stock Items</div>
                  <div className="fs-4 fw-bold">{lowStockItems.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card border-start border-4 h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="icon-square bg-dark text-white d-flex align-items-center justify-content-center flex-shrink-0">
                  <i className="bi bi-currency-rupee"></i>
                </div>
                <div>
                  <div className="text-muted small">Total Inventory Value</div>
                  <div className="fs-4 fw-bold">₹{totalValue.toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {canManage && (
          <form className="row g-2 mb-4" onSubmit={handleSubmit}>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Product name"
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

            <div className="col-md-3">
              <select
                className="form-select"
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                disabled={saving || categories.length === 0}
              >
                <option value="">
                  {categories.length ? "Select category" : "No active categories"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                placeholder="Price"
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
                disabled={saving}
                required
              />
            </div>

            <div className="col-md-3">
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingProduct
                    ? "Update Product"
                    : "Add Product"}
              </button>
            </div>
          </form>
        )}

        {!canManage && (
          <p className="text-muted small mb-3">
            You have view-only access to products. Product changes are restricted to inventory administrators.
          </p>
        )}

        {canManage && editingProduct && (
          <button
            type="button"
            className="btn btn-link px-0 mb-3"
            onClick={resetForm}
            disabled={saving}
          >
            Cancel editing
          </button>
        )}

        <p className="text-muted small mb-3">
          Current stock is managed through Stock In / Stock Out. Removing a product with inventory or transaction history deactivates it instead of destroying business history.
        </p>

        {loading ? (
          <div className="py-5 text-center text-muted">
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            Loading products...
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Price</th>
                  {canManage && <th className="text-end">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="text-center text-muted py-4">
                      No active products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className={product.totalStock < 5 ? "table-warning" : ""}
                    >
                      <td>#{product.id}</td>
                      <td>{product.name}</td>
                      <td>{product.category || "—"}</td>
                      <td>{product.totalStock}</td>
                      <td>₹{Number(product.price || 0).toLocaleString("en-IN")}</td>
                      {canManage && (
                        <td className="text-end text-nowrap">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => startEdit(product)}
                            disabled={saving}
                            aria-label={`Edit ${product.name}`}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(product)}
                            disabled={saving}
                            aria-label={`Remove ${product.name}`}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
