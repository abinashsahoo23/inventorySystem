namespace InventoryApi.DTOs
{
    public class SalesOrderItemInputDto
    {
        public int ProductId { get; set; }

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }
    }

    public class CreateSalesOrderDto
    {
        public int CustomerId { get; set; }

        public int WarehouseId { get; set; }

        public List<SalesOrderItemInputDto> Items { get; set; }
            = new();
    }

    public class SalesOrderItemDto
    {
        public int Id { get; set; }

        public int ProductId { get; set; }

        public string ProductName { get; set; } = string.Empty;

        public string SKU { get; set; } = string.Empty;

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal LineTotal =>
            Quantity * UnitPrice;
    }

    public class SalesOrderDto
    {
        public int Id { get; set; }

        public int CustomerId { get; set; }

        public string CustomerName { get; set; } = string.Empty;

        public int WarehouseId { get; set; }

        public string WarehouseName { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public DateTime OrderDate { get; set; }

        public DateTime? CompletedDate { get; set; }

        public string? InvoiceNumber { get; set; }

        public string CreatedBy { get; set; } = string.Empty;

        public string CreatedByRole { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }

        public int ItemCount { get; set; }

        public List<SalesOrderItemDto> Items { get; set; }
            = new();
    }

    public class InvoiceDto
    {
        public int SalesOrderId { get; set; }

        public string InvoiceNumber { get; set; } = string.Empty;

        public DateTime InvoiceDate { get; set; }

        public string CustomerName { get; set; } = string.Empty;

        public string CustomerPhone { get; set; } = string.Empty;

        public string CustomerEmail { get; set; } = string.Empty;

        public string CustomerAddress { get; set; } = string.Empty;

        public string WarehouseName { get; set; } = string.Empty;

        public string CreatedBy { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }

        public List<SalesOrderItemDto> Items { get; set; }
            = new();
    }
}