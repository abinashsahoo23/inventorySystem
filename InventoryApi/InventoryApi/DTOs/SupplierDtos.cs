namespace InventoryApi.DTOs
{
    public class SupplierInputDto
    {
        public string Name { get; set; } = string.Empty;

        public string ContactPerson { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;
    }

    public class SupplierDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string ContactPerson { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public int PurchaseCount { get; set; }

        public decimal TotalPurchaseAmount { get; set; }
    }

    public class SupplierHistoryDto
    {
        public int PurchaseOrderId { get; set; }

        public string Status { get; set; } = string.Empty;

        public DateTime OrderDate { get; set; }

        public DateTime? ReceivedDate { get; set; }

        public string WarehouseName { get; set; } = string.Empty;

        public string CreatedBy { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }

        public int ItemCount { get; set; }
    }
}