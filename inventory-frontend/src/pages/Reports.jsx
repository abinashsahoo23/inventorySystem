import { useEffect, useState } from "react";
import { api } from "../api";

const reportTypes = [
  {
    id: "inventory",
    label: "Inventory Report",
  },
  {
    id: "sales",
    label: "Sales Report",
  },
  {
    id: "purchases",
    label: "Purchase Report",
  },
  {
    id: "stock-movements",
    label: "Stock Movement Report",
  },
  {
    id: "low-stock",
    label: "Low Stock Report",
  },
  {
    id: "user-activity",
    label: "User Activity Report",
  },
];

export default function Reports() {
  const [report, setReport] = useState("inventory");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadReport(selectedReport) {
    setLoading(true);
    setError("");

    try {
      let result;

      switch (selectedReport) {
        case "sales":
          result = await api.getSalesReport();
          break;

        case "purchases":
          result = await api.getPurchaseReport();
          break;

        case "stock-movements":
          result = await api.getStockMovementReport();
          break;

        case "low-stock":
          result = await api.getLowStockReport();
          break;

        case "user-activity":
          result = await api.getUserActivityReport();
          break;

        case "inventory":
        default:
          result = await api.getInventoryReport();
          break;
      }

      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err?.message || "Unable to load report.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(report);
  }, [report]);

  return (
    <>
      <div className="mb-4">
        <h3>Reports</h3>

        <p className="text-muted mb-0">
          View inventory, sales, purchase, stock and activity reports.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="bg-white rounded-4 shadow p-3 mb-4">
        <div className="d-flex flex-wrap gap-2">
          {reportTypes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`btn ${
                report === item.id
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => setReport(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-4 shadow overflow-hidden">
        <div className="p-3 border-bottom">
          <h5 className="mb-0">
            {
              reportTypes.find(
                (item) => item.id === report
              )?.label
            }
          </h5>
        </div>

        {loading ? (
          <div className="p-4 text-muted">
            Loading report...
          </div>
        ) : (
          <>
            {report === "inventory" && (
              <InventoryTable data={data} />
            )}

            {report === "sales" && (
              <SalesTable data={data} />
            )}

            {report === "purchases" && (
              <PurchaseTable data={data} />
            )}

            {report === "stock-movements" && (
              <StockMovementTable data={data} />
            )}

            {report === "low-stock" && (
              <LowStockTable data={data} />
            )}

            {report === "user-activity" && (
              <ActivityTable data={data} />
            )}
          </>
        )}
      </div>
    </>
  );
}

function EmptyRow({ columns }) {
  return (
    <tr>
      <td
        colSpan={columns}
        className="text-center text-muted py-4"
      >
        No data found.
      </td>
    </tr>
  );
}

function InventoryTable({ data }) {
  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Inventory Value</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.productId}>
              <td>{item.productName}</td>

              <td>{item.category || "—"}</td>

              <td>
                ₹
                {Number(item.price).toLocaleString("en-IN")}
              </td>

              <td>{item.totalStock}</td>

              <td>
                ₹
                {Number(item.inventoryValue).toLocaleString(
                  "en-IN"
                )}
              </td>
            </tr>
          ))}

          {data.length === 0 && (
            <EmptyRow columns={5} />
          )}
        </tbody>
      </table>
    </div>
  );
}

function SalesTable({ data }) {
  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Warehouse</th>
            <th>Status</th>
            <th>Date</th>
            <th>Invoice</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.orderId}>
              <td>#{item.orderId}</td>

              <td>{item.customerName}</td>

              <td>{item.warehouseName}</td>

              <td>{item.status}</td>

              <td>
                {new Date(
                  item.orderDate
                ).toLocaleDateString()}
              </td>

              <td>{item.invoiceNumber || "—"}</td>

              <td>
                ₹
                {Number(item.totalAmount).toLocaleString(
                  "en-IN"
                )}
              </td>
            </tr>
          ))}

          {data.length === 0 && (
            <EmptyRow columns={7} />
          )}
        </tbody>
      </table>
    </div>
  );
}

function PurchaseTable({ data }) {
  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Order</th>
            <th>Supplier</th>
            <th>Warehouse</th>
            <th>Status</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.orderId}>
              <td>#{item.orderId}</td>

              <td>{item.supplierName}</td>

              <td>{item.warehouseName}</td>

              <td>{item.status}</td>

              <td>
                {new Date(
                  item.orderDate
                ).toLocaleDateString()}
              </td>

              <td>{item.itemCount}</td>

              <td>
                ₹
                {Number(item.totalAmount).toLocaleString(
                  "en-IN"
                )}
              </td>
            </tr>
          ))}

          {data.length === 0 && (
            <EmptyRow columns={7} />
          )}
        </tbody>
      </table>
    </div>
  );
}

function StockMovementTable({ data }) {
  return (
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
            <th>Performed By</th>
            <th>Reason</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>
                {new Date(
                  item.timestamp
                ).toLocaleString()}
              </td>

              <td>{item.productName}</td>

              <td>{item.warehouseName}</td>

              <td>{item.type}</td>

              <td>{item.quantityChange}</td>

              <td>{item.quantityAfter}</td>

              <td>{item.performedBy}</td>

              <td>{item.reason}</td>
            </tr>
          ))}

          {data.length === 0 && (
            <EmptyRow columns={8} />
          )}
        </tbody>
      </table>
    </div>
  );
}

function LowStockTable({ data }) {
  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Current Stock</th>
            <th>Threshold</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.productId}>
              <td>{item.productName}</td>

              <td>{item.category || "—"}</td>

              <td>
                ₹
                {Number(item.price).toLocaleString("en-IN")}
              </td>

              <td>{item.totalStock}</td>

              <td>{item.threshold}</td>

              <td>
                {item.totalStock === 0 ? (
                  <span className="badge text-bg-danger">
                    Out of stock
                  </span>
                ) : (
                  <span className="badge text-bg-warning">
                    Low stock
                  </span>
                )}
              </td>
            </tr>
          ))}

          {data.length === 0 && (
            <EmptyRow columns={6} />
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTable({ data }) {
  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Date</th>
            <th>User</th>
            <th>Role</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Target</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>
                {new Date(
                  item.timestamp
                ).toLocaleString()}
              </td>

              <td>{item.performedBy}</td>

              <td>{item.performedByRole}</td>

              <td>{item.action}</td>

              <td>{item.entityType}</td>

              <td>{item.targetName}</td>
            </tr>
          ))}

          {data.length === 0 && (
            <EmptyRow columns={6} />
          )}
        </tbody>
      </table>
    </div>
  );
}