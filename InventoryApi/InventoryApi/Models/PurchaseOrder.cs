using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryApi.Models
{
    public enum PurchaseOrderStatus
    {
        Pending = 0,
        Received = 1,
        Cancelled = 2
    }

    [Table("PurchaseOrders")]
    public class PurchaseOrder
    {
        [Key]
        public int Id { get; set; }

        public int SupplierId { get; set; }
        public Supplier Supplier { get; set; } = null!;

        public int WarehouseId { get; set; }
        public Warehouse Warehouse { get; set; } = null!;

        public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Pending;

        public DateTime OrderDate { get; set; } = DateTime.Now;
        public DateTime? ReceivedDate { get; set; }

        public string CreatedBy { get; set; } = string.Empty;
        public string CreatedByRole { get; set; } = string.Empty;

        public List<PurchaseOrderItem> Items { get; set; } = new();
    }
}