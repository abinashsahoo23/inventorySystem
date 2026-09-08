using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryApi.Models
{
    [Table("TaskHistory")]
    public class TaskHistory
    {
        [Key]
        public int Id { get; set; }

        public int TaskItemId { get; set; }

        [ForeignKey(nameof(TaskItemId))]
        public TaskItem Task { get; set; } = null!;

        public TaskStatus OldStatus { get; set; }

        public TaskStatus NewStatus { get; set; }

        public int ChangedByUserId { get; set; }

        [ForeignKey(nameof(ChangedByUserId))]
        public User ChangedByUser { get; set; } = null!;

        public DateTime ChangedAt { get; set; }
            = DateTime.Now;
    }
}