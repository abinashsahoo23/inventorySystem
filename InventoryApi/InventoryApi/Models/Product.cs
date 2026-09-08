using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryApi.Models
{
    [Table("Products")]
    public class Product
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? SKU { get; set; }

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public decimal PurchasePrice { get; set; }

        public int MinimumStockLevel { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public string Category { get; set; } = string.Empty;

        public int? CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public Category? CategoryEntity { get; set; }

        public int? BrandId { get; set; }

        [ForeignKey(nameof(BrandId))]
        public Brand? Brand { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}