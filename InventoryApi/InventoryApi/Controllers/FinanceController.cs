using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.DTOs;
using InventoryApi.Models;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/finance")]
    public class FinanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FinanceController(
            AppDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // FINANCIAL SUMMARY
        // =====================================================

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var sales =
                await _context.SalesOrders
                    .AsNoTracking()
                    .Where(
                        so =>
                            so.Status ==
                            SalesOrderStatus.Completed
                    )
                    .SelectMany(
                        so =>
                            so.Items
                    )
                    .SumAsync(
                        i =>
                            (decimal?)
                                (
                                    i.Quantity *
                                    i.UnitPrice
                                )
                    ) ?? 0;

            var purchases =
                await _context.PurchaseOrders
                    .AsNoTracking()
                    .Where(
                        po =>
                            po.Status ==
                            PurchaseOrderStatus.Received
                    )
                    .SelectMany(
                        po =>
                            po.Items
                    )
                    .SumAsync(
                        i =>
                            (decimal?)
                                (
                                    i.Quantity *
                                    i.UnitPrice
                                )
                    ) ?? 0;

            var expenses =
                await _context.Expenses
                    .AsNoTracking()
                    .SumAsync(
                        e =>
                            (decimal?)
                                e.Amount
                    ) ?? 0;

            var salesCount =
                await _context.SalesOrders
                    .CountAsync(
                        so =>
                            so.Status ==
                            SalesOrderStatus.Completed
                    );

            var purchaseCount =
                await _context.PurchaseOrders
                    .CountAsync(
                        po =>
                            po.Status ==
                            PurchaseOrderStatus.Received
                    );

            var expenseCount =
                await _context.Expenses
                    .CountAsync();

            return Ok(
                new FinanceSummaryDto
                {
                    SalesAmount =
                        sales,

                    PurchaseAmount =
                        purchases,

                    ExpenseAmount =
                        expenses,

                    Profit =
                        sales -
                        purchases -
                        expenses,

                    CompletedSalesCount =
                        salesCount,

                    ReceivedPurchaseCount =
                        purchaseCount,

                    ExpenseCount =
                        expenseCount
                }
            );
        }

        // =====================================================
        // EXPENSES
        // =====================================================

        [HttpGet("expenses")]
        public async Task<IActionResult> GetExpenses()
        {
            var expenses =
                await _context.Expenses
                    .AsNoTracking()
                    .OrderByDescending(
                        e =>
                            e.ExpenseDate
                    )
                    .ThenByDescending(
                        e =>
                            e.Id
                    )
                    .Select(
                        e =>
                            new ExpenseDto
                            {
                                Id =
                                    e.Id,

                                Description =
                                    e.Description,

                                Category =
                                    e.Category,

                                Amount =
                                    e.Amount,

                                ExpenseDate =
                                    e.ExpenseDate,

                                CreatedBy =
                                    e.CreatedBy,

                                CreatedAt =
                                    e.CreatedAt
                            }
                    )
                    .ToListAsync();

            return Ok(expenses);
        }

        [HttpPost("expenses")]
        public async Task<IActionResult> CreateExpense(
            CreateExpenseDto dto,
            [FromHeader(Name = "X-User-Name")]
            string userName)
        {
            if (
                string.IsNullOrWhiteSpace(
                    dto.Description
                )
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Expense description is required."
                    }
                );
            }

            if (dto.Amount <= 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Expense amount must be greater than zero."
                    }
                );
            }

            var expense =
                new Expense
                {
                    Description =
                        dto.Description.Trim(),

                    Category =
                        dto.Category?.Trim()
                        ?? string.Empty,

                    Amount =
                        dto.Amount,

                    ExpenseDate =
                        dto.ExpenseDate == default
                            ? DateTime.Now
                            : dto.ExpenseDate,

                    CreatedBy =
                        string.IsNullOrWhiteSpace(
                            userName
                        )
                            ? "Unknown"
                            : userName,

                    CreatedAt =
                        DateTime.Now
                };

            _context.Expenses.Add(
                expense
            );

            await _context.SaveChangesAsync();

            return Ok(
                new ExpenseDto
                {
                    Id =
                        expense.Id,

                    Description =
                        expense.Description,

                    Category =
                        expense.Category,

                    Amount =
                        expense.Amount,

                    ExpenseDate =
                        expense.ExpenseDate,

                    CreatedBy =
                        expense.CreatedBy,

                    CreatedAt =
                        expense.CreatedAt
                }
            );
        }

        [HttpPut("expenses/{id}")]
        public async Task<IActionResult> UpdateExpense(
            int id,
            UpdateExpenseDto dto)
        {
            var expense =
                await _context.Expenses
                    .FindAsync(id);

            if (expense == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Expense not found."
                    }
                );
            }

            if (
                string.IsNullOrWhiteSpace(
                    dto.Description
                )
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Expense description is required."
                    }
                );
            }

            if (dto.Amount <= 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Expense amount must be greater than zero."
                    }
                );
            }

            expense.Description =
                dto.Description.Trim();

            expense.Category =
                dto.Category?.Trim()
                ?? string.Empty;

            expense.Amount =
                dto.Amount;

            expense.ExpenseDate =
                dto.ExpenseDate;

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        "Expense updated successfully."
                }
            );
        }

        [HttpDelete("expenses/{id}")]
        public async Task<IActionResult> DeleteExpense(
            int id)
        {
            var expense =
                await _context.Expenses
                    .FindAsync(id);

            if (expense == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Expense not found."
                    }
                );
            }

            _context.Expenses.Remove(
                expense
            );

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        "Expense deleted successfully."
                }
            );
        }

        // =====================================================
        // INVOICES
        // =====================================================

        [HttpGet("invoices")]
        public async Task<IActionResult> GetInvoices()
        {
            var invoices =
                await _context.SalesOrders
                    .AsNoTracking()
                    .Include(
                        so =>
                            so.Customer
                    )
                    .Include(
                        so =>
                            so.Warehouse
                    )
                    .Include(
                        so =>
                            so.Items
                    )
                    .Where(
                        so =>
                            so.Status ==
                            SalesOrderStatus.Completed
                    )
                    .OrderByDescending(
                        so =>
                            so.CompletedDate
                    )
                    .Select(
                        so =>
                            new FinanceInvoiceDto
                            {
                                SalesOrderId =
                                    so.Id,

                                InvoiceNumber =
                                    so.InvoiceNumber
                                    ??
                                    $"INV-{so.Id:D5}",

                                InvoiceDate =
                                    so.CompletedDate
                                    ??
                                    so.OrderDate,

                                CustomerName =
                                    so.Customer.Name,

                                WarehouseName =
                                    so.Warehouse.Name,

                                TotalAmount =
                                    so.Items.Sum(
                                        i =>
                                            i.Quantity *
                                            i.UnitPrice
                                    )
                            }
                    )
                    .ToListAsync();

            return Ok(invoices);
        }
    }
}