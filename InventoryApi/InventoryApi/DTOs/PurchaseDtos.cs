namespace InventoryApi.DTOs
{
    public class CreatePurchaseOrderDto
    {
        public int SupplierId { get; set; }

        public int WarehouseId { get; set; }

        public List<PurchaseOrderItemInputDto> Items { get; set; }
            = new();
    }

    public class PurchaseOrderItemInputDto
    {
        public int ProductId { get; set; }

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }
    }

    public class PurchaseOrderItemDto
    {
        public int Id { get; set; }

        public int ProductId { get; set; }

        public string ProductName { get; set; } = string.Empty;

        public string SKU { get; set; } = string.Empty;

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal Total { get; set; }
    }

    public class PurchaseOrderDto
    {
        public int Id { get; set; }

        public int SupplierId { get; set; }

        public string SupplierName { get; set; } = string.Empty;

        public int WarehouseId { get; set; }

        public string WarehouseName { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public DateTime OrderDate { get; set; }

        public DateTime? ReceivedDate { get; set; }

        public string CreatedBy { get; set; } = string.Empty;

        public string CreatedByRole { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }

        public int ItemCount { get; set; }

        public List<PurchaseOrderItemDto> Items { get; set; }
            = new();
    }
}