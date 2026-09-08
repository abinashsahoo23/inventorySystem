import { useEffect, useState } from "react";
import { api } from "../api";

export default function LowStock() {
  const [items, setItems] = useState([]);
  const [threshold, setThreshold] = useState("");
  const [outOnly, setOutOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setItems(
        await api.getLowStock(
          threshold || undefined
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
  }, []);

  const visible = outOnly
    ? items.filter((item) => item.isOutOfStock)
    : items;

  return (
    <>
      <div className="mb-4">
        <h3>Low Stock</h3>
        <p className="text-muted mb-0">
          Products at or below their minimum stock level.
        </p>
      </div>

      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="Optional global threshold"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <button
              className="btn btn-primary w-100"
              onClick={load}
              disabled={loading}
            >
              Apply
            </button>
          </div>

          <div className="col-md-3">
            <div className="form-check">
              <input
                id="out-only"
                className="form-check-input"
                type="checkbox"
                checked={outOnly}
                onChange={(e) => setOutOnly(e.target.checked)}
              />
              <label
                htmlFor="out-only"
                className="form-check-label"
              >
                Out of stock only
              </label>
            </div>
          </div>

          <div className="col-md-3 text-muted small">
            Empty threshold uses each product's minimum.
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 mt-3 mb-0">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-4 shadow overflow-hidden">
        <div className="p-3 border-bottom">
          <strong>
            {loading
              ? "Loading..."
              : `${visible.length} product${
                  visible.length === 1 ? "" : "s"
                }`}
          </strong>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Minimum</th>
                <th>Current</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {visible.map((item) => (
                <tr key={item.productId}>
                  <td>{item.productName}</td>
                  <td>{item.sku || "—"}</td>
                  <td>{item.category || "—"}</td>
                  <td>{item.brand || "—"}</td>
                  <td>{item.minimumStockLevel}</td>
                  <td>{item.totalStock}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.isOutOfStock
                          ? "text-bg-danger"
                          : "text-bg-warning"
                      }`}
                    >
                      {item.isOutOfStock
                        ? "Out of stock"
                        : "Low stock"}
                    </span>
                  </td>
                </tr>
              ))}

              {!loading && visible.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center text-muted py-4"
                  >
                    No low-stock products.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center text-muted py-4"
                  >
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