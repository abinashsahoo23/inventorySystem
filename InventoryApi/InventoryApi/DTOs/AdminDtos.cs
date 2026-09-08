namespace InventoryApi.DTOs
{
    public class AdminOverviewDto
    {
        public int TotalUsers { get; set; }
        public int PendingUsers { get; set; }
        public int ApprovedUsers { get; set; }

        public List<RoleCountDto> UsersByRole { get; set; } = new();

        public int TotalProducts { get; set; }
        public int OutOfStockProducts { get; set; }
        public int LowStockProducts { get; set; }

        public decimal TotalStockValue { get; set; }

        public List<LowStockProductDto> LowStockItems { get; set; } = new();

        public List<RecentActivityDto> RecentActivity { get; set; } = new();
    }

    public class RoleCountDto
    {
        public string Role { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class LowStockProductDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int CurrentStock { get; set; }
        public int MinimumStock { get; set; }
        public bool OutOfStock { get; set; }
    }

    public class RecentActivityDto
    {
        public string EntityType { get; set; } = string.Empty;
        public string TargetName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string PerformedBy { get; set; } = string.Empty;
        public string PerformedByRole { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}