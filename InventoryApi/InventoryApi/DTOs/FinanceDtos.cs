namespace InventoryApi.DTOs
{
    public class CreateExpenseDto
    {
        public string Description { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public DateTime ExpenseDate { get; set; }
    }

    public class UpdateExpenseDto
    {
        public string Description { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public DateTime ExpenseDate { get; set; }
    }

    public class ExpenseDto
    {
        public int Id { get; set; }

        public string Description { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public DateTime ExpenseDate { get; set; }

        public string CreatedBy { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
    }

    public class FinanceSummaryDto
    {
        public decimal SalesAmount { get; set; }

        public decimal PurchaseAmount { get; set; }

        public decimal ExpenseAmount { get; set; }

        public decimal Profit { get; set; }

        public int CompletedSalesCount { get; set; }

        public int ReceivedPurchaseCount { get; set; }

        public int ExpenseCount { get; set; }
    }

    public class FinanceInvoiceDto
    {
        public int SalesOrderId { get; set; }

        public string InvoiceNumber { get; set; } = string.Empty;

        public DateTime InvoiceDate { get; set; }

        public string CustomerName { get; set; } = string.Empty;

        public string WarehouseName { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }
    }
}