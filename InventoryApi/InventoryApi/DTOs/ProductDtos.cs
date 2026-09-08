namespace InventoryApi.DTOs
{
    public class CreateProductDto
    {
        public string Name { get; set; } = string.Empty;

        public string? SKU { get; set; }

        public string Description { get; set; } = string.Empty;

        public int? CategoryId { get; set; }

        public int? BrandId { get; set; }

        public decimal PurchasePrice { get; set; }

        public decimal SellingPrice { get; set; }

        public int MinimumStockLevel { get; set; }
    }

    public class UpdateProductDto
    {
        public string Name { get; set; } = string.Empty;

        public string? SKU { get; set; }

        public string Description { get; set; } = string.Empty;

        public int? CategoryId { get; set; }

        public int? BrandId { get; set; }

        public decimal PurchasePrice { get; set; }

        public decimal SellingPrice { get; set; }

        public int MinimumStockLevel { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class ProductResponseDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string SKU { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int? CategoryId { get; set; }

        public string Category { get; set; } = string.Empty;

        public int? BrandId { get; set; }

        public string Brand { get; set; } = string.Empty;

        public decimal PurchasePrice { get; set; }

        public decimal SellingPrice { get; set; }

        public decimal Price { get; set; }

        public int MinimumStockLevel { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public int TotalStock { get; set; }
    }

    public class BulkImportRowError
    {
        public int Row { get; set; }

        public string Message { get; set; } = string.Empty;
    }

    public class BulkImportResultDto
    {
        public string Message { get; set; } = string.Empty;

        public int Imported { get; set; }
    }
}