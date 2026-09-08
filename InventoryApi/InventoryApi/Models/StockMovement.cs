using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryApi.Models
{
    public enum StockMovementType
    {
        In = 0,
        Out = 1,
        Adjustment = 2,
        Transfer = 3
    }

    [Table("StockMovements")]
    public class StockMovement
    {
        [Key]
        public int Id { get; set; }

        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        public int WarehouseId { get; set; }
        public Warehouse Warehouse { get; set; } = null!;

        public StockMovementType Type { get; set; }


        public int Quantity { get; set; }


        public int QuantityAfter { get; set; }

        public string Reason { get; set; } = string.Empty;
        public string PerformedBy { get; set; } = string.Empty;
        public string PerformedByRole { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }
}