using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryApi.Models
{
    public enum SalesOrderStatus
    {
        Pending = 0,
        Completed = 1,
        Cancelled = 2
    }

    [Table("SalesOrders")]
    public class SalesOrder
    {
        [Key]
        public int Id { get; set; }

        public int CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;

        // Warehouse the items are sold out of.
        public int WarehouseId { get; set; }
        public Warehouse Warehouse { get; set; } = null!;

        public SalesOrderStatus Status { get; set; } = SalesOrderStatus.Pending;

        public DateTime OrderDate { get; set; } = DateTime.Now;
        public DateTime? CompletedDate { get; set; }

        // Set only once the order is completed and stock actually leaves.
        public string? InvoiceNumber { get; set; }

        public string CreatedBy { get; set; } = string.Empty;
        public string CreatedByRole { get; set; } = string.Empty;

        public List<SalesOrderItem> Items { get; set; } = new();
    }
}