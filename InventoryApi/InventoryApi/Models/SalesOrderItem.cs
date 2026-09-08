using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryApi.Models
{
    [Table("SalesOrderItems")]
    public class SalesOrderItem
    {
        [Key]
        public int Id { get; set; }

        public int SalesOrderId { get; set; }
        public SalesOrder SalesOrder { get; set; } = null!;

        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        public int Quantity { get; set; }

        // Price actually charged — may differ from Product.Price (discounts etc.),
        // and stays fixed on the order even if the product's price changes later.
        public decimal UnitPrice { get; set; }
    }
}