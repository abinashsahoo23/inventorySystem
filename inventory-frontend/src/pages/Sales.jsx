import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

const emptyLine = {
  productId: "",
  quantity: "",
  unitPrice: "",
};

const emptyForm = {
  customerId: "",
  warehouseId: "",
};

const statuses = ["", "Pending", "Completed", "Cancelled"];

export default function Sales() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [lines, setLines] = useState([{ ...emptyLine }]);

  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [invoice, setInvoice] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [orders, customers, warehouses, products] =
        await Promise.all([
          api.getSalesOrders(status),
          api.getCustomers(),
          api.getWarehouses(),
          api.getProducts(undefined, undefined, undefined, true),
        ]);

      setOrders(orders);
      setCustomers(customers);
      // Keep every warehouse visible. Inactive warehouses are shown but
      // cannot be selected for a new sale.
      setWarehouses(warehouses);
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

  useEffect(() => {
    let active = true;

    async function loadWarehouseStock() {
      if (!form.warehouseId) {
        setWarehouseStock([]);
        setStockLoading(false);
        return;
      }

      setStockLoading(true);
      setError("");

      try {
        const stock = await api.getWarehouseStock(Number(form.warehouseId));
        if (active) {
          setWarehouseStock(stock);
        }
      } catch (err) {
        if (active) {
          setWarehouseStock([]);
          setError(err.message);
        }
      } finally {
        if (active) {
          setStockLoading(false);
        }
      }
    }

    loadWarehouseStock();

    return () => {
      active = false;
    };
  }, [form.warehouseId]);

  function change(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function changeLine(index, field, value) {
    setLines((current) =>
      current.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    );
  }

  function getAvailableQuantity(productId) {
    const row = warehouseStock.find(
      (item) => String(item.productId) === String(productId)
    );
    return row?.quantity ?? 0;
  }

  const availableProducts = useMemo(() => {
    if (!form.warehouseId || stockLoading) return [];

    return products.filter(
      (product) => getAvailableQuantity(product.id) > 0
    );
  }, [products, warehouseStock, form.warehouseId, stockLoading]);

  function selectWarehouse(value) {
    change("warehouseId", value);

    // Warehouse changes invalidate every selected product because stock is
    // warehouse-specific.
    setLines([{ ...emptyLine }]);
    setWarehouseStock([]);
  }

  function selectProduct(index, productId) {
    const product = products.find(
      (item) => String(item.id) === String(productId)
    );

    changeLine(index, "productId", productId);
    changeLine(
      index,
      "unitPrice",
      product?.sellingPrice ?? product?.price ?? ""
    );
  }

  function addLine() {
    setLines((current) => [...current, { ...emptyLine }]);
  }

  function removeLine(index) {
    if (lines.length === 1) return;

    setLines((current) => current.filter((_, i) => i !== index));
  }

  function reset() {
    setForm(emptyForm);
    setLines([{ ...emptyLine }]);
    setWarehouseStock([]);
  }

  async function createSale(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.customerId || !form.warehouseId) {
      setError("Customer and warehouse are required.");
      return;
    }

    const items = lines.filter(
      (line) => line.productId && line.quantity
    );

    if (!items.length) {
      setError("Add at least one product.");
      return;
    }

    const requestedByProduct = new Map();

    for (const item of items) {
      const quantity = Number(item.quantity);

      if (quantity <= 0) {
        setError("Quantity must be greater than zero.");
        return;
      }

      if (Number(item.unitPrice) < 0) {
        setError("Unit price cannot be negative.");
        return;
      }

      const available = getAvailableQuantity(item.productId);
      const requested =
        (requestedByProduct.get(Number(item.productId)) || 0) + quantity;

      requestedByProduct.set(Number(item.productId), requested);

      if (available <= 0) {
        setError("Selected product has no stock in this warehouse.");
        return;
      }

      if (requested > available) {
        const product = products.find(
          (entry) => String(entry.id) === String(item.productId)
        );
        setError(
          `${product?.name || "Product"}: only ${available} available in the selected warehouse.`
        );
        return;
      }
    }

    setSaving(true);

    try {
      await api.createSalesOrder({
        customerId: Number(form.customerId),
        warehouseId: Number(form.warehouseId),
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      });

      setMessage("Sales order created successfully.");
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function openDetails(id) {
    setError("");

    try {
      setSelected(await api.getSalesOrder(id));
      setInvoice(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateOrder(action, text) {
    if (!window.confirm(text)) return;

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

  function completeSale(id) {
    updateOrder(
      () => api.completeSalesOrder(id),
      "Complete this sale? Stock will be deducted and an invoice will be generated."
    );
  }

  function cancelSale(id) {
    updateOrder(
      () => api.cancelSalesOrder(id),
      "Cancel this sales order?"
    );
  }

  async function openInvoice(id) {
    setError("");

    try {
      setInvoice(await api.getSalesInvoice(id));
      setSelected(null);
    } catch (err) {
      setError(err.message);
    }
  }

  const total = lines.reduce(
    (sum, line) =>
      sum + Number(line.quantity || 0) * Number(line.unitPrice || 0),
    0
  );

  return (
    <>
      <div className="mb-4">
        <h3>Sales Management</h3>
        <p className="text-muted mb-0">
          Create sales orders, complete sales and view invoices.
        </p>
      </div>

      {message && <div className="alert alert-success py-2">{message}</div>}

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {/* Create sale */}
      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <h5 className="mb-3">Create Sale</h5>

        <form onSubmit={createSale}>
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <select
                className="form-select"
                value={form.warehouseId}
                onChange={(e) => selectWarehouse(e.target.value)}
                required
              >
                <option value="">Select warehouse first</option>

                {warehouses.map((warehouse) => (
                  <option
                    key={warehouse.id}
                    value={warehouse.id}
                    disabled={warehouse.isActive === false}
                  >
                    {warehouse.name}
                    {warehouse.isActive === false ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <select
                className="form-select"
                value={form.customerId}
                onChange={(e) => change("customerId", e.target.value)}
                required
              >
                <option value="">Select customer</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {lines.map((line, index) => (
            <div className="row g-2 mb-2" key={index}>
              <div className="col-md-5">
                <select
                  className="form-select"
                  value={line.productId}
                  disabled={!form.warehouseId || stockLoading}
                  onChange={(e) => selectProduct(index, e.target.value)}
                  required
                >
                  <option value="">
                    {!form.warehouseId
                      ? "Select warehouse first"
                      : stockLoading
                        ? "Loading warehouse stock..."
                        : availableProducts.length
                          ? "Select product"
                          : "No products in this warehouse"}
                  </option>

                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                      {product.sku ? ` (${product.sku})` : ""}
                      {` — ${getAvailableQuantity(product.id)} available`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <input
                  type="number"
                  min="1"
                  max={line.productId ? getAvailableQuantity(line.productId) : undefined}
                  className="form-control"
                  placeholder={
                    line.productId
                      ? `Qty (max ${getAvailableQuantity(line.productId)})`
                      : "Quantity"
                  }
                  value={line.quantity}
                  disabled={!line.productId}
                  onChange={(e) =>
                    changeLine(index, "quantity", e.target.value)
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
                  disabled={!line.productId}
                  onChange={(e) =>
                    changeLine(index, "unitPrice", e.target.value)
                  }
                  required
                />
              </div>

              <div className="col-md-2">
                <button
                  type="button"
                  className="btn btn-outline-danger w-100"
                  onClick={() => removeLine(index)}
                  disabled={lines.length === 1}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {!form.warehouseId && (
            <div className="text-muted small mt-2">
              Select a warehouse to load only the products currently stocked there.
            </div>
          )}

          {form.warehouseId && !stockLoading && availableProducts.length === 0 && (
            <div className="text-warning small mt-2">
              This warehouse currently has no active products with available stock.
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center mt-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={addLine}
              disabled={!form.warehouseId || stockLoading || availableProducts.length === 0}
            >
              + Add product
            </button>

            <strong>
              Total: ₹{total.toLocaleString("en-IN")}
            </strong>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || stockLoading || !form.warehouseId}
            >
              {saving ? "Creating..." : "Create Sale"}
            </button>
          </div>
        </form>
      </div>

      {/* Sales history */}
      <div className="bg-white rounded-4 shadow overflow-hidden mb-4">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Sales History</h5>

          <select
            className="form-select form-select-sm"
            style={{ width: "180px" }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item || "All statuses"}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-4 text-muted">Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
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
                    <td>{order.customerName}</td>
                    <td>{order.warehouseName}</td>
                    <td>{order.itemCount}</td>

                    <td>
                      ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span className="badge text-bg-secondary">
                        {order.status}
                      </span>
                    </td>

                    <td>
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>

                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => openDetails(order.id)}
                      >
                        Details
                      </button>

                      {order.status === "Pending" && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-success me-1"
                            onClick={() => completeSale(order.id)}
                          >
                            Complete
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => cancelSale(order.id)}
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {order.status === "Completed" && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success ms-1"
                          onClick={() => openInvoice(order.id)}
                        >
                          Invoice
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {!orders.length && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      No sales orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order details */}
      {selected && (
        <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
          <div className="d-flex justify-content-between mb-3">
            <div>
              <h5>Sales Order #{selected.id}</h5>
              <div className="text-muted">
                {selected.customerName} → {selected.warehouseName}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          <div className="row g-3 mb-3">
            <Info title="Status" value={selected.status} />
            <Info
              title="Date"
              value={new Date(selected.orderDate).toLocaleString()}
            />
            <Info title="Created By" value={selected.createdBy} />
            <Info
              title="Invoice"
              value={selected.invoiceNumber || "Not generated"}
            />
          </div>

          <OrderItems items={selected.items} />

          <div className="text-end fw-semibold">
            Total: ₹{Number(selected.totalAmount).toLocaleString("en-IN")}
          </div>
        </div>
      )}

      {/* Invoice */}
      {invoice && (
        <div className="bg-white rounded-4 shadow p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h4>Invoice {invoice.invoiceNumber}</h4>
              <div className="text-muted">
                Sales Order #{invoice.salesOrderId}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setInvoice(null)}
            >
              Close
            </button>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <strong>Customer</strong>
              <div>{invoice.customerName}</div>
              <div>{invoice.customerPhone}</div>
              <div>{invoice.customerEmail}</div>
              <div>{invoice.customerAddress}</div>
            </div>

            <div className="col-md-4">
              <strong>Warehouse</strong>
              <div>{invoice.warehouseName}</div>
              <div>Created by: {invoice.createdBy}</div>
              <div>
                Date: {new Date(invoice.invoiceDate).toLocaleString()}
              </div>
            </div>

            <div className="col-md-4 text-md-end">
              <strong>Total</strong>
              <div className="fs-4 fw-bold">
                ₹{Number(invoice.totalAmount).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <OrderItems items={invoice.items} />
        </div>
      )}
    </>
  );
}

function Info({ title, value }) {
  return (
    <div className="col-md-3">
      <div className="text-muted small">{title}</div>
      <div>{value || "—"}</div>
    </div>
  );
}

function OrderItems({ items = [] }) {
  return (
    <div className="table-responsive mb-3">
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
          {items.map((item) => (
            <tr key={item.id || `${item.productId}-${item.quantity}`}>
              <td>{item.productName}</td>
              <td>{item.sku || "—"}</td>
              <td>{item.quantity}</td>
              <td>₹{Number(item.unitPrice).toLocaleString("en-IN")}</td>
              <td>
                ₹{(
                  Number(item.quantity) * Number(item.unitPrice)
                ).toLocaleString("en-IN")}
              </td>
            </tr>
          ))}

          {!items.length && (
            <tr>
              <td colSpan="5" className="text-center text-muted py-3">
                No items.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
