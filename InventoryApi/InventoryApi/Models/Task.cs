using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InventoryApi.Models
{
    [Table("Tasks")]
    public class TaskItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        public int AssignedToUserId { get; set; }

        [ForeignKey(nameof(AssignedToUserId))]
        public User AssignedToUser { get; set; } = null!;

        public int CreatedByUserId { get; set; }

        [ForeignKey(nameof(CreatedByUserId))]
        public User CreatedByUser { get; set; } = null!;

        public TaskStatus Status { get; set; }
            = TaskStatus.Pending;

        public DateTime? DueDate { get; set; }

        public DateTime CreatedAt { get; set; }
            = DateTime.Now;

        public DateTime UpdatedAt { get; set; }
            = DateTime.Now;

        public ICollection<TaskHistory> History { get; set; }
            = new List<TaskHistory>();
    }

    public enum TaskStatus
    {
        Pending,
        InProgress,
        Completed,
        Cancelled
    }
}