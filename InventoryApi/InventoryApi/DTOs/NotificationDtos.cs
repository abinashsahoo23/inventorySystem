namespace InventoryApi.DTOs
{
    public class NotificationDto
    {
        public int Id { get; set; }

        public string Type { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    public class CreateNotificationDto
    {
        public int UserId { get; set; }

        public string Type { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;
    }

    public class NotificationPreferencesDto
    {
        public bool NotifyLowStock { get; set; }

        public bool NotifyUserRequest { get; set; }

        public bool NotifyPurchase { get; set; }

        public bool NotifyTask { get; set; }
    }
}