import { useEffect, useState } from "react";
import { api } from "../api";

const emptyForm = {
  productId: "",
  warehouseId: "",
  toWarehouseId: "",
  quantity: "",
  reason: "",
};

const actions = [
  ["in", "Stock In"],
  ["out", "Stock Out"],
  ["adjust", "Adjustment"],
  ["transfer", "Transfer"],
];

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stock, setStock] = useState([]);
  const [history, setHistory] = useState([]);

  const [action, setAction] = useState("in");
  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [products, warehouses, stock, history] =
        await Promise.all([
          api.getStockTotals(),
          api.getWarehouses(),
          api.getStock(),
          api.getStockHistory(),
        ]);

      setProducts(products);
      setWarehouses(warehouses);
      setStock(stock);
      setHistory(history);
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

  function changeAction(value) {
    setAction(value);
    setForm({
      ...emptyForm,
      productId: form.productId,
      warehouseId: form.warehouseId,
    });
    setMessage("");
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.productId ||
      !form.warehouseId ||
      form.quantity === ""
    ) {
      setError(
        "Product, warehouse and quantity are required."
      );
      return;
    }

    if (
      action === "transfer" &&
      !form.toWarehouseId
    ) {
      setError(
        "Destination warehouse is required."
      );
      return;
    }

    if (
      action === "transfer" &&
      form.warehouseId === form.toWarehouseId
    ) {
      setError(
        "Source and destination warehouses must be different."
      );
      return;
    }

    if (
      action === "adjust" &&
      !form.reason.trim()
    ) {
      setError(
        "A reason is required for adjustments."
      );
      return;
    }

    const quantity = Number(form.quantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setError(
        "Quantity must be a whole number of 0 or more."
      );
      return;
    }

    if (
      action !== "adjust" &&
      quantity === 0
    ) {
      setError(
        "Quantity must be greater than zero."
      );
      return;
    }

    setSaving(true);

    try {
      const productId = Number(form.productId);
      const warehouseId = Number(form.warehouseId);
      let result;

      if (action === "in") {
        result = await api.stockIn(
          productId,
          warehouseId,
          quantity,
          form.reason
        );
      }

      if (action === "out") {
        result = await api.stockOut(
          productId,
          warehouseId,
          quantity,
          form.reason
        );
      }

      if (action === "adjust") {
        result = await api.adjustStock(
          productId,
          warehouseId,
          quantity,
          form.reason
        );
      }

      if (action === "transfer") {
        result = await api.transferStock(
          productId,
          warehouseId,
          Number(form.toWarehouseId),
          quantity,
          form.reason
        );
      }

      setMessage(
        result?.message ||
          "Inventory updated successfully."
      );

      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedProduct = products.find(
    (item) =>
      String(item.productId) ===
      String(form.productId)
  );

  return (
    <>
      <div className="mb-4">
        <h3 className="mb-1">Inventory</h3>
        <p className="text-muted mb-0">
          Manage stock movement across warehouses.
        </p>
      </div>

      {/* Stock action */}
      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <div className="d-flex gap-2 flex-wrap mb-3">
          {actions.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`btn ${
                action === value
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => changeAction(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <form className="row g-2" onSubmit={save}>
          <div className="col-md-3">
            <select
              className="form-select"
              value={form.productId}
              onChange={(e) =>
                change("productId", e.target.value)
              }
              required
            >
              <option value="">Select product</option>

              {products.map((item) => (
                <option
                  key={item.productId}
                  value={item.productId}
                >
                  {item.productName}
                  {item.sku
                    ? ` (${item.sku})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <select
              className="form-select"
              value={form.warehouseId}
              onChange={(e) =>
                change("warehouseId", e.target.value)
              }
              required
            >
              <option value="">
                {action === "transfer"
                  ? "From warehouse"
                  : "Warehouse"}
              </option>

              {warehouses.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {action === "transfer" && (
            <div className="col-md-2">
              <select
                className="form-select"
                value={form.toWarehouseId}
                onChange={(e) =>
                  change(
                    "toWarehouseId",
                    e.target.value
                  )
                }
                required
              >
                <option value="">
                  To warehouse
                </option>

                {warehouses.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="col-md-2">
            <input
              type="number"
              min="0"
              step="1"
              className="form-control"
              placeholder={
                action === "adjust"
                  ? "New quantity"
                  : "Quantity"
              }
              value={form.quantity}
              onChange={(e) =>
                change("quantity", e.target.value)
              }
              required
            />
          </div>

          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Reason"
              value={form.reason}
              onChange={(e) =>
                change("reason", e.target.value)
              }
            />
          </div>

          <div className="col-md-1">
            <button
              className="btn btn-primary w-100"
              disabled={saving}
            >
              {saving ? "..." : "Go"}
            </button>
          </div>
        </form>

        {selectedProduct && (
          <div className="small text-muted mt-3">
            Minimum stock:{" "}
            {selectedProduct.minimumStockLevel}
            {" | "}
            Current total:{" "}
            {selectedProduct.totalStock}
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

      {/* Current stock */}
      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <h5 className="mb-3">Current Stock</h5>

        {loading ? (
          <div className="text-muted">Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Minimum</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {products.map((item) => (
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
                            : item.isLowStock
                            ? "text-bg-warning"
                            : "text-bg-success"
                        }`}
                      >
                        {item.isOutOfStock
                          ? "Out"
                          : item.isLowStock
                          ? "Low"
                          : "OK"}
                      </span>
                    </td>
                  </tr>
                ))}

                {!products.length && (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center text-muted py-3"
                    >
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warehouse stock */}
      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <h5 className="mb-3">Warehouse Stock</h5>

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
                <tr
                  key={`${item.productId}-${item.warehouseId}`}
                >
                  <td>{item.productName}</td>
                  <td>{item.sku || "—"}</td>
                  <td>{item.warehouseName}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}

              {!stock.length && (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center text-muted py-3"
                  >
                    No stock rows yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-4 shadow p-3 p-md-4">
        <h5 className="mb-3">
          Stock Movement History
        </h5>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Type</th>
                <th>Change</th>
                <th>After</th>
                <th>Reason</th>
                <th>By</th>
              </tr>
            </thead>

            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    {new Date(
                      item.timestamp
                    ).toLocaleString()}
                  </td>

                  <td>{item.productName}</td>
                  <td>{item.warehouseName}</td>
                  <td>{item.type}</td>

                  <td
                    className={
                      item.quantityChange > 0
                        ? "text-success"
                        : item.quantityChange < 0
                        ? "text-danger"
                        : ""
                    }
                  >
                    {item.quantityChange > 0
                      ? `+${item.quantityChange}`
                      : item.quantityChange}
                  </td>

                  <td>{item.quantityAfter}</td>
                  <td>{item.reason}</td>
                  <td>{item.performedBy}</td>
                </tr>
              ))}

              {!history.length && (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center text-muted py-3"
                  >
                    No stock movements yet.
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