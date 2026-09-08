using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryApi.Models
{
    [Table("ActivityLogs")]
    public class ActivityLog
    {
        [Key]
        public int Id { get; set; }
        public string EntityType { get; set; } = "Product"; 
        public string TargetName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string PerformedBy { get; set; } = string.Empty;
        public string PerformedByRole { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }
}