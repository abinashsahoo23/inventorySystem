namespace InventoryApi.DTOs
{
    public class InventoryReportDto
    {
        public int ProductId { get; set; }

        public string ProductName { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public int TotalStock { get; set; }

        public decimal InventoryValue { get; set; }
    }

    public class SalesReportDto
    {
        public int OrderId { get; set; }

        public string CustomerName { get; set; } = string.Empty;

        public string WarehouseName { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public DateTime OrderDate { get; set; }

        public DateTime? CompletedDate { get; set; }

        public string InvoiceNumber { get; set; } = string.Empty;

        public string CreatedBy { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }

        public int ItemCount { get; set; }
    }

    public class PurchaseReportDto
    {
        public int OrderId { get; set; }

        public string SupplierName { get; set; } = string.Empty;

        public string WarehouseName { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public DateTime OrderDate { get; set; }

        public DateTime? ReceivedDate { get; set; }

        public string CreatedBy { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }

        public int ItemCount { get; set; }
    }

    public class StockMovementReportDto
    {
        public int Id { get; set; }

        public string ProductName { get; set; } = string.Empty;

        public string WarehouseName { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public int QuantityChange { get; set; }

        public int QuantityAfter { get; set; }

        public string Reason { get; set; } = string.Empty;

        public string PerformedBy { get; set; } = string.Empty;

        public string PerformedByRole { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; }
    }

    public class LowStockReportDto
    {
        public int ProductId { get; set; }

        public string ProductName { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public int TotalStock { get; set; }

        public int Threshold { get; set; }
    }

    public class UserActivityReportDto
    {
        public int Id { get; set; }

        public string EntityType { get; set; } = string.Empty;

        public string TargetName { get; set; } = string.Empty;

        public string Action { get; set; } = string.Empty;

        public string PerformedBy { get; set; } = string.Empty;

        public string PerformedByRole { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; }
    }
}