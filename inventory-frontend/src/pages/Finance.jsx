import { useEffect, useState } from "react";
import { api } from "../api";

const emptyForm = {
  description: "",
  category: "",
  amount: "",
  expenseDate: "",
};

export default function Finance() {
  const [summary, setSummary] =
    useState(null);

  const [expenses, setExpenses] =
    useState([]);

  const [invoices, setInvoices] =
    useState([]);

  const [form, setForm] =
    useState(emptyForm);

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        summaryData,
        expenseData,
        invoiceData,
      ] = await Promise.all([
        api.getFinanceSummary(),
        api.getExpenses(),
        api.getFinanceInvoices(),
      ]);

      setSummary(summaryData);
      setExpenses(expenseData);
      setInvoices(invoiceData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(expense) {
    setEditingId(expense.id);

    setForm({
      description:
        expense.description || "",

      category:
        expense.category || "",

      amount:
        expense.amount ?? "",

      expenseDate:
        expense.expenseDate
          ? expense.expenseDate.slice(
              0,
              10
            )
          : "",
    });

    setError("");
    setMessage("");
  }

  async function saveExpense(
    event
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !form.description.trim()
    ) {
      setError(
        "Expense description is required."
      );
      return;
    }

    if (
      Number(form.amount) <= 0
    ) {
      setError(
        "Expense amount must be greater than zero."
      );
      return;
    }

    setSaving(true);

    try {
      const data = {
        description:
          form.description.trim(),

        category:
          form.category.trim(),

        amount:
          Number(form.amount),

        expenseDate:
          form.expenseDate
            ? new Date(
                `${form.expenseDate}T00:00:00`
              ).toISOString()
            : new Date().toISOString(),
      };

      if (editingId) {
        await api.updateExpense(
          editingId,
          data
        );

        setMessage(
          "Expense updated successfully."
        );
      } else {
        await api.addExpense(
          data
        );

        setMessage(
          "Expense added successfully."
        );
      }

      resetForm();

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(
    expense
  ) {
    if (
      !window.confirm(
        `Delete expense "${expense.description}"?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const result =
        await api.deleteExpense(
          expense.id
        );

      setMessage(
        result.message
      );

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="mb-4">
        <h3>Finance</h3>

        <p className="text-muted mb-0">
          View financial totals, expenses and invoices.
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

      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="bg-white rounded-4 shadow p-3">
              <div className="text-muted">
                Sales Amount
              </div>

              <h4 className="mb-0">
                ₹
                {Number(
                  summary.salesAmount
                ).toLocaleString(
                  "en-IN"
                )}
              </h4>

              <small className="text-muted">
                {
                  summary.completedSalesCount
                } completed sales
              </small>
            </div>
          </div>

          <div className="col-md-3">
            <div className="bg-white rounded-4 shadow p-3">
              <div className="text-muted">
                Purchase Amount
              </div>

              <h4 className="mb-0">
                ₹
                {Number(
                  summary.purchaseAmount
                ).toLocaleString(
                  "en-IN"
                )}
              </h4>

              <small className="text-muted">
                {
                  summary.receivedPurchaseCount
                } received purchases
              </small>
            </div>
          </div>

          <div className="col-md-3">
            <div className="bg-white rounded-4 shadow p-3">
              <div className="text-muted">
                Expenses
              </div>

              <h4 className="mb-0">
                ₹
                {Number(
                  summary.expenseAmount
                ).toLocaleString(
                  "en-IN"
                )}
              </h4>

              <small className="text-muted">
                {summary.expenseCount} expenses
              </small>
            </div>
          </div>

          <div className="col-md-3">
            <div className="bg-white rounded-4 shadow p-3">
              <div className="text-muted">
                Profit
              </div>

              <h4
                className={
                  Number(
                    summary.profit
                  ) >= 0
                    ? "text-success mb-0"
                    : "text-danger mb-0"
                }
              >
                ₹
                {Number(
                  summary.profit
                ).toLocaleString(
                  "en-IN"
                )}
              </h4>

              <small className="text-muted">
                Sales - Purchases - Expenses
              </small>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-4 shadow p-3 p-md-4 mb-4">
        <h5 className="mb-3">
          {editingId
            ? "Edit Expense"
            : "Add Expense"}
        </h5>

        <form
          className="row g-2"
          onSubmit={saveExpense}
        >
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Description"
              value={
                form.description
              }
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              disabled={saving}
              required
            />
          </div>

          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Category"
              value={
                form.category
              }
              onChange={(event) =>
                updateField(
                  "category",
                  event.target.value
                )
              }
              disabled={saving}
            />
          </div>

          <div className="col-md-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="form-control"
              placeholder="Amount"
              value={
                form.amount
              }
              onChange={(event) =>
                updateField(
                  "amount",
                  event.target.value
                )
              }
              disabled={saving}
              required
            />
          </div>

          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              value={
                form.expenseDate
              }
              onChange={(event) =>
                updateField(
                  "expenseDate",
                  event.target.value
                )
              }
              disabled={saving}
            />
          </div>

          <div className="col-md-1">
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={saving}
            >
              {saving
                ? "..."
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
                onClick={resetForm}
              >
                Cancel edit
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="bg-white rounded-4 shadow overflow-hidden mb-4">
        <div className="p-3 border-bottom">
          <h5 className="mb-0">
            Expenses
          </h5>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Created By</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {expenses.map(
                (expense) => (
                  <tr
                    key={
                      expense.id
                    }
                  >
                    <td>
                      {
                        expense.description
                      }
                    </td>

                    <td>
                      {expense.category ||
                        "—"}
                    </td>

                    <td>
                      ₹
                      {Number(
                        expense.amount
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    <td>
                      {new Date(
                        expense.expenseDate
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {
                        expense.createdBy
                      }
                    </td>

                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() =>
                          startEdit(
                            expense
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          deleteExpense(
                            expense
                          )
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}

              {!loading &&
                expenses.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center text-muted py-4"
                    >
                      No expenses yet.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow overflow-hidden">
        <div className="p-3 border-bottom">
          <h5 className="mb-0">
            Invoices
          </h5>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Sales Order</th>
                <th>Customer</th>
                <th>Warehouse</th>
                <th>Date</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {invoices.map(
                (invoice) => (
                  <tr
                    key={
                      invoice.salesOrderId
                    }
                  >
                    <td>
                      {
                        invoice.invoiceNumber
                      }
                    </td>

                    <td>
                      #
                      {
                        invoice.salesOrderId
                      }
                    </td>

                    <td>
                      {
                        invoice.customerName
                      }
                    </td>

                    <td>
                      {
                        invoice.warehouseName
                      }
                    </td>

                    <td>
                      {new Date(
                        invoice.invoiceDate
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      ₹
                      {Number(
                        invoice.totalAmount
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </td>
                  </tr>
                )
              )}

              {!loading &&
                invoices.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center text-muted py-4"
                    >
                      No invoices yet.
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