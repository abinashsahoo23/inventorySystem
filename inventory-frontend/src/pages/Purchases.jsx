import { useEffect, useState } from "react";
import { api } from "../api";

const emptyLine = {
  productId: "",
  quantity: "",
  unitPrice: "",
};

const emptyForm = {
  supplierId: "",
  warehouseId: "",
};

const statuses = ["", "Pending", "Received", "Cancelled"];

export default function Purchases() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [lines, setLines] = useState([{ ...emptyLine }]);

  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [orders, suppliers, warehouses, products] =
        await Promise.all([
          api.getPurchaseOrders(status),
          api.getSuppliers(undefined, true),
          api.getWarehouses(),
          api.getProducts(undefined, undefined, undefined, true),
        ]);

      setOrders(orders);
      setSuppliers(suppliers);
      setWarehouses(warehouses.filter((x) => x.isActive));
      setProducts(products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  function change(field, value) {
    setForm((form) => ({
      ...form,
      [field]: value,
    }));
  }

  function changeLine(index, field, value) {
    setLines((lines) =>
      lines.map((line, i) =>
        i === index
          ? { ...line, [field]: value }
          : line
      )
    );
  }

  function selectProduct(index, productId) {
    const product = products.find(
      (x) => String(x.id) === String(productId)
    );

    setLines((lines) =>
      lines.map((line, i) =>
        i === index
          ? {
              ...line,
              productId,
              unitPrice: product?.purchasePrice ?? "",
            }
          : line
      )
    );
  }

  function addLine() {
    setLines((lines) => [
      ...lines,
      { ...emptyLine },
    ]);
  }

  function removeLine(index) {
    if (lines.length === 1) return;

    setLines((lines) =>
      lines.filter((_, i) => i !== index)
    );
  }

  function reset() {
    setForm(emptyForm);
    setLines([{ ...emptyLine }]);
  }

  async function create(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.supplierId || !form.warehouseId) {
      setError("Supplier and warehouse are required.");
      return;
    }

    const validLines = lines.filter(
      (line) => line.productId && line.quantity
    );

    if (!validLines.length) {
      setError("Add at least one product.");
      return;
    }

    for (const line of validLines) {
      if (Number(line.quantity) <= 0) {
        setError("Quantity must be greater than zero.");
        return;
      }

      if (Number(line.unitPrice) < 0) {
        setError("Unit price cannot be negative.");
        return;
      }
    }

    setSaving(true);

    try {
      await api.createPurchaseOrder({
        supplierId: Number(form.supplierId),
        warehouseId: Number(form.warehouseId),
        items: validLines.map((line) => ({
          productId: Number(line.productId),
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
        })),
      });

      setMessage("Purchase order created successfully.");
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function open(id) {
    setError("");

    try {
      setSelected(await api.getPurchaseOrder(id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function receive(id) {
    if (!window.confirm("Receive this purchase order?")) {
      return;
    }

    await updateOrder(
      () => api.receivePurchaseOrder(id)
    );
  }

  async function cancel(id) {
    if (!window.confirm("Cancel this purchase order?")) {
      return;
    }

    await updateOrder(
      () => api.cancelPurchaseOrder(id)
    );
  }

  async function updateOrder(action) {
    setError("");
    setMessage("");

    try {
      const result = await action();
      setMessage(result.message);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const total = lines.reduce(
    (sum, line) =>
      sum +
      Number(line.quantity || 0) *
        Number(line.unitPrice || 0),
    0
  );

  return (
    <>
      <div className="mb-4">
        <h3>Purchase Management</h3>
        <p className="text-muted mb-0">
          Create, receive and review purchase orders.
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

      {/* Create purchase */}
      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <h5 className="mb-3">Create Purchase</h5>

        <form onSubmit={create}>
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <select
                className="form-select"
                value={form.supplierId}
                onChange={(e) =>
                  change("supplierId", e.target.value)
                }
                required
              >
                <option value="">Select supplier</option>

                {suppliers.map((supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                  >
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <select
                className="form-select"
                value={form.warehouseId}
                onChange={(e) =>
                  change("warehouseId", e.target.value)
                }
                required
              >
                <option value="">
                  Receive into warehouse
                </option>

                {warehouses.map((warehouse) => (
                  <option
                    key={warehouse.id}
                    value={warehouse.id}
                  >
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {lines.map((line, index) => (
            <div
              className="row g-2 mb-2"
              key={index}
            >
              <div className="col-md-5">
                <select
                  className="form-select"
                  value={line.productId}
                  onChange={(e) =>
                    selectProduct(
                      index,
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                      {product.sku
                        ? ` (${product.sku})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  placeholder="Quantity"
                  value={line.quantity}
                  onChange={(e) =>
                    changeLine(
                      index,
                      "quantity",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="col-md-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  placeholder="Unit price"
                  value={line.unitPrice}
                  onChange={(e) =>
                    changeLine(
                      index,
                      "unitPrice",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="col-md-2">
                <button
                  type="button"
                  className="btn btn-outline-danger w-100"
                  onClick={() =>
                    removeLine(index)
                  }
                  disabled={lines.length === 1}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="d-flex justify-content-between align-items-center mt-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={addLine}
            >
              + Add product
            </button>

            <strong>
              Total: ₹
              {total.toLocaleString("en-IN")}
            </strong>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>

      {/* Orders */}
      <div className="bg-white rounded-4 shadow overflow-hidden mb-4">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Purchase Orders</h5>

          <select
            className="form-select form-select-sm"
            style={{ width: "180px" }}
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
          >
            {statuses.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item || "All statuses"}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-4 text-muted">
            Loading...
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>PO</th>
                  <th>Supplier</th>
                  <th>Warehouse</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.supplierName}</td>
                    <td>{order.warehouseName}</td>
                    <td>{order.itemCount}</td>

                    <td>
                      ₹
                      {Number(
                        order.totalAmount
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span className="badge text-bg-secondary">
                        {order.status}
                      </span>
                    </td>

                    <td>
                      {new Date(
                        order.orderDate
                      ).toLocaleDateString()}
                    </td>

                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() =>
                          open(order.id)
                        }
                      >
                        Details
                      </button>

                      {order.status ===
                        "Pending" && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-success me-1"
                            onClick={() =>
                              receive(order.id)
                            }
                          >
                            Receive
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              cancel(order.id)
                            }
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}

                {!orders.length && (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center text-muted py-4"
                    >
                      No purchase orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details */}
      {selected && (
        <div className="bg-white rounded-4 shadow p-3 p-md-4">
          <div className="d-flex justify-content-between mb-3">
            <div>
              <h5>
                Purchase Order #{selected.id}
              </h5>

              <div className="text-muted">
                {selected.supplierName} →{" "}
                {selected.warehouseName}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() =>
                setSelected(null)
              }
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
              title="Order Date"
              value={new Date(
                selected.orderDate
              ).toLocaleString()}
            />

            <Info
              title="Received"
              value={
                selected.receivedDate
                  ? new Date(
                      selected.receivedDate
                    ).toLocaleString()
                  : "Not received"
              }
            />

            <Info
              title="Created By"
              value={selected.createdBy}
            />
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {selected.items.map(
                  (item, index) => (
                    <tr
                      key={
                        item.id || index
                      }
                    >
                      <td>{item.productName}</td>
                      <td>{item.sku || "—"}</td>
                      <td>{item.quantity}</td>

                      <td>
                        ₹
                        {Number(
                          item.unitPrice
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        ₹
                        {Number(
                          item.total
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="fw-semibold text-end">
            Total: ₹
            {Number(
              selected.totalAmount
            ).toLocaleString("en-IN")}
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