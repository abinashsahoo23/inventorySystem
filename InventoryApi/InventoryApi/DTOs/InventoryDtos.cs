namespace InventoryApi.DTOs
{
    public class StockInDto
    {
        public int ProductId { get; set; }

        public int WarehouseId { get; set; }

        public int Quantity { get; set; }

        public string Reason { get; set; } = string.Empty;
    }

    public class StockOutDto
    {
        public int ProductId { get; set; }

        public int WarehouseId { get; set; }

        public int Quantity { get; set; }

        public string Reason { get; set; } = string.Empty;
    }

    public class StockAdjustDto
    {
        public int ProductId { get; set; }

        public int WarehouseId { get; set; }

        public int NewQuantity { get; set; }

        public string Reason { get; set; } = string.Empty;
    }

    public class StockTransferDto
    {
        public int ProductId { get; set; }

        public int FromWarehouseId { get; set; }

        public int ToWarehouseId { get; set; }

        public int Quantity { get; set; }

        public string Reason { get; set; } = string.Empty;
    }

    public class ProductStockDto
    {
        public int ProductId { get; set; }

        public string ProductName { get; set; } = string.Empty;

        public string SKU { get; set; } = string.Empty;

        public int WarehouseId { get; set; }

        public string WarehouseName { get; set; } = string.Empty;

        public int Quantity { get; set; }
    }

    public class ProductTotalStockDto
    {
        public int ProductId { get; set; }

        public string ProductName { get; set; } = string.Empty;

        public string SKU { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public string Brand { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public int MinimumStockLevel { get; set; }

        public int TotalStock { get; set; }

        public bool IsLowStock { get; set; }

        public bool IsOutOfStock { get; set; }
    }

    public class StockMovementDto
    {
        public int Id { get; set; }

        public int ProductId { get; set; }

        public string ProductName { get; set; } = string.Empty;

        public string SKU { get; set; } = string.Empty;

        public int WarehouseId { get; set; }

        public string WarehouseName { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public int QuantityChange { get; set; }

        public int QuantityAfter { get; set; }

        public string Reason { get; set; } = string.Empty;

        public string PerformedBy { get; set; } = string.Empty;

        public string PerformedByRole { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; }
    }
}