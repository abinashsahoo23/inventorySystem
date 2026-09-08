using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.DTOs;
using InventoryApi.Models;

// Use the application's TaskStatus enum.
// This avoids conflict with System.Threading.Tasks.TaskStatus.
using InventoryTaskStatus = InventoryApi.Models.TaskStatus;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(
            AppDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET NOTIFICATIONS
        // =====================================================

        [HttpGet]
        public async Task<IActionResult> GetNotifications(
            [FromHeader(Name = "X-User-Email")]
            string userEmail,
            [FromQuery] bool unreadOnly = false)
        {
            var user =
                await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(
                        u =>
                            u.Email ==
                            userEmail
                    );

            if (user == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Current user not found."
                    }
                );
            }

            await SyncNotifications(user);

            var query =
                _context.Notifications
                    .AsNoTracking()
                    .Where(
                        n =>
                            n.UserId ==
                            user.Id
                    );

            if (unreadOnly)
            {
                query =
                    query.Where(
                        n =>
                            !n.IsRead
                    );
            }

            var notifications =
                await query
                    .OrderByDescending(
                        n =>
                            n.CreatedAt
                    )
                    .Take(100)
                    .Select(
                        n =>
                            new NotificationDto
                            {
                                Id =
                                    n.Id,

                                Type =
                                    n.Type,

                                Title =
                                    n.Title,

                                Message =
                                    n.Message,

                                IsRead =
                                    n.IsRead,

                                CreatedAt =
                                    n.CreatedAt
                            }
                    )
                    .ToListAsync();

            return Ok(
                notifications
            );
        }

        // =====================================================
        // UNREAD COUNT
        // =====================================================

        [HttpGet("count")]
        public async Task<IActionResult> GetUnreadCount(
            [FromHeader(Name = "X-User-Email")]
            string userEmail)
        {
            var user =
                await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(
                        u =>
                            u.Email ==
                            userEmail
                    );

            if (user == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Current user not found."
                    }
                );
            }

            await SyncNotifications(user);

            var count =
                await _context.Notifications
                    .CountAsync(
                        n =>
                            n.UserId ==
                                user.Id &&
                            !n.IsRead
                    );

            return Ok(
                new
                {
                    count
                }
            );
        }

        // =====================================================
        // CREATE SYSTEM NOTIFICATION
        // =====================================================

        [HttpPost]
        public async Task<IActionResult> Create(
            CreateNotificationDto dto)
        {
            if (dto.UserId <= 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "User is required."
                    }
                );
            }

            if (
                string.IsNullOrWhiteSpace(
                    dto.Title
                )
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Notification title is required."
                    }
                );
            }

            if (
                string.IsNullOrWhiteSpace(
                    dto.Message
                )
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Notification message is required."
                    }
                );
            }

            var userExists =
                await _context.Users
                    .AnyAsync(
                        u =>
                            u.Id ==
                            dto.UserId
                    );

            if (!userExists)
            {
                return NotFound(
                    new
                    {
                        message =
                            "User not found."
                    }
                );
            }

            var notification =
                new Notification
                {
                    UserId =
                        dto.UserId,

                    Type =
                        string.IsNullOrWhiteSpace(
                            dto.Type
                        )
                            ? "System"
                            : dto.Type.Trim(),

                    Title =
                        dto.Title.Trim(),

                    Message =
                        dto.Message.Trim(),

                    IsRead =
                        false,

                    CreatedAt =
                        DateTime.Now
                };

            _context.Notifications.Add(
                notification
            );

            await _context.SaveChangesAsync();

            return Ok(
                ToDto(notification)
            );
        }

        // =====================================================
        // MARK ONE READ
        // =====================================================

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(
            int id,
            [FromHeader(Name = "X-User-Email")]
            string userEmail)
        {
            var user =
                await _context.Users
                    .FirstOrDefaultAsync(
                        u =>
                            u.Email ==
                            userEmail
                    );

            if (user == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Current user not found."
                    }
                );
            }

            var notification =
                await _context.Notifications
                    .FirstOrDefaultAsync(
                        n =>
                            n.Id ==
                                id &&
                            n.UserId ==
                                user.Id
                    );

            if (notification == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Notification not found."
                    }
                );
            }

            notification.IsRead = true;

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        "Notification marked as read."
                }
            );
        }

        // =====================================================
        // MARK ALL READ
        // =====================================================

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead(
            [FromHeader(Name = "X-User-Email")]
            string userEmail)
        {
            var user =
                await _context.Users
                    .FirstOrDefaultAsync(
                        u =>
                            u.Email ==
                            userEmail
                    );

            if (user == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Current user not found."
                    }
                );
            }

            var notifications =
                await _context.Notifications
                    .Where(
                        n =>
                            n.UserId ==
                                user.Id &&
                            !n.IsRead
                    )
                    .ToListAsync();

            foreach (
                var notification
                in notifications
            )
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        "All notifications marked as read.",

                    count =
                        notifications.Count
                }
            );
        }

        // =====================================================
        // DELETE
        // =====================================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(
            int id,
            [FromHeader(Name = "X-User-Email")]
            string userEmail)
        {
            var user =
                await _context.Users
                    .FirstOrDefaultAsync(
                        u =>
                            u.Email ==
                            userEmail
                    );

            if (user == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Current user not found."
                    }
                );
            }

            var notification =
                await _context.Notifications
                    .FirstOrDefaultAsync(
                        n =>
                            n.Id ==
                                id &&
                            n.UserId ==
                                user.Id
                    );

            if (notification == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Notification not found."
                    }
                );
            }

            _context.Notifications.Remove(
                notification
            );

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        "Notification deleted."
                }
            );
        }

        // =====================================================
        // GET MY NOTIFICATION PREFERENCES
        // =====================================================

        [HttpGet("preferences")]
        public async Task<IActionResult> GetPreferences(
            [FromHeader(Name = "X-User-Email")]
            string userEmail)
        {
            var user =
                await _context.Users
                    .FirstOrDefaultAsync(
                        u =>
                            u.Email ==
                            userEmail
                    );

            if (user == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Current user not found."
                    }
                );
            }

            return Ok(
                new NotificationPreferencesDto
                {
                    NotifyLowStock =
                        user.NotifyLowStock,

                    NotifyUserRequest =
                        user.NotifyUserRequest,

                    NotifyPurchase =
                        user.NotifyPurchase,

                    NotifyTask =
                        user.NotifyTask
                }
            );
        }

        // =====================================================
        // UPDATE MY NOTIFICATION PREFERENCES
        // =====================================================

        [HttpPut("preferences")]
        public async Task<IActionResult> UpdatePreferences(
            NotificationPreferencesDto dto,
            [FromHeader(Name = "X-User-Email")]
            string userEmail)
        {
            var user =
                await _context.Users
                    .FirstOrDefaultAsync(
                        u =>
                            u.Email ==
                            userEmail
                    );

            if (user == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Current user not found."
                    }
                );
            }

            user.NotifyLowStock =
                dto.NotifyLowStock;

            user.NotifyUserRequest =
                dto.NotifyUserRequest;

            user.NotifyPurchase =
                dto.NotifyPurchase;

            user.NotifyTask =
                dto.NotifyTask;

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        "Notification preferences updated."
                }
            );
        }

        // =====================================================
        // NOTIFICATION SYNC
        // =====================================================

        private async Task SyncNotifications(
            User user)
        {
            await SyncLowStockNotifications(user);

            await SyncUserRequestNotifications(user);

            await SyncPurchaseNotifications(user);

            await SyncTaskNotifications(user);

            await _context.SaveChangesAsync();
        }

        // =====================================================
        // LOW STOCK
        // =====================================================

        private async Task SyncLowStockNotifications(
            User user)
        {
            if (
                !CanReceiveLowStockNotification(
                    user
                )
            )
            {
                return;
            }

            const int threshold = 10;

            var products =
                await _context.Products
                    .AsNoTracking()
                    .Where(
                        p =>
                            p.IsActive
                    )
                    .ToListAsync();

            foreach (
                var product
                in products
            )
            {
                var stock =
                    await _context.ProductStocks
                        .Where(
                            ps =>
                                ps.ProductId ==
                                product.Id
                        )
                        .SumAsync(
                            ps =>
                                (int?)
                                    ps.Quantity
                        ) ?? 0;

                if (
                    stock >
                    threshold
                )
                {
                    continue;
                }

                var title =
                    stock == 0
                        ? "Out of Stock Alert"
                        : "Low Stock Alert";

                var message =
                    stock == 0
                        ? $"{product.Name} is out of stock."
                        : $"{product.Name} has only {stock} units remaining.";

                bool exists =
                    await _context.Notifications
                        .AnyAsync(
                            n =>
                                n.UserId ==
                                    user.Id &&
                                n.Type ==
                                    "LowStock" &&
                                n.Title ==
                                    title &&
                                n.Message ==
                                    message
                        );

                if (!exists)
                {
                    _context.Notifications.Add(
                        new Notification
                        {
                            UserId =
                                user.Id,

                            Type =
                                "LowStock",

                            Title =
                                title,

                            Message =
                                message,

                            IsRead =
                                false,

                            CreatedAt =
                                DateTime.Now
                        }
                    );
                }
            }
        }

        // =====================================================
        // NEW USER REQUEST
        // =====================================================

        private async Task SyncUserRequestNotifications(
            User user)
        {
            if (
                !CanReceiveUserRequestNotification(
                    user
                )
            )
            {
                return;
            }

            var pendingUsers =
                await _context.Users
                    .Where(
                        u =>
                            u.Status ==
                            "Pending"
                    )
                    .ToListAsync();

            foreach (
                var pendingUser
                in pendingUsers
            )
            {
                var title =
                    "New User Request";

                var message =
                    $"{pendingUser.Name} has requested an account.";

                bool exists =
                    await _context.Notifications
                        .AnyAsync(
                            n =>
                                n.UserId ==
                                    user.Id &&
                                n.Type ==
                                    "UserRequest" &&
                                n.Title ==
                                    title &&
                                n.Message ==
                                    message
                        );

                if (!exists)
                {
                    _context.Notifications.Add(
                        new Notification
                        {
                            UserId =
                                user.Id,

                            Type =
                                "UserRequest",

                            Title =
                                title,

                            Message =
                                message,

                            IsRead =
                                false,

                            CreatedAt =
                                DateTime.Now
                        }
                    );
                }
            }
        }

        // =====================================================
        // PURCHASE
        // =====================================================

        private async Task SyncPurchaseNotifications(
            User user)
        {
            if (
                !CanReceivePurchaseNotification(
                    user
                )
            )
            {
                return;
            }

            var pendingOrders =
                await _context.PurchaseOrders
                    .Include(
                        po =>
                            po.Supplier
                    )
                    .Where(
                        po =>
                            po.Status ==
                            PurchaseOrderStatus.Pending
                    )
                    .OrderByDescending(
                        po =>
                            po.OrderDate
                    )
                    .Take(20)
                    .ToListAsync();

            foreach (
                var order
                in pendingOrders
            )
            {
                var title =
                    $"Purchase Order #{order.Id}";

                var supplier =
                    order.Supplier?.Name
                    ?? "Unknown Supplier";

                var message =
                    $"Purchase order #{order.Id} from {supplier} is pending.";

                bool exists =
                    await _context.Notifications
                        .AnyAsync(
                            n =>
                                n.UserId ==
                                    user.Id &&
                                n.Type ==
                                    "Purchase" &&
                                n.Title ==
                                    title &&
                                n.Message ==
                                    message
                        );

                if (!exists)
                {
                    _context.Notifications.Add(
                        new Notification
                        {
                            UserId =
                                user.Id,

                            Type =
                                "Purchase",

                            Title =
                                title,

                            Message =
                                message,

                            IsRead =
                                false,

                            CreatedAt =
                                DateTime.Now
                        }
                    );
                }
            }
        }

        // =====================================================
        // TASK
        // =====================================================

        private async Task SyncTaskNotifications(
            User user)
        {
            if (!user.NotifyTask)
            {
                return;
            }

            var tasks =
                await _context.Tasks
                    .Where(
                        t =>
                            t.AssignedToUserId ==
                                user.Id &&
                            t.Status !=
                                InventoryTaskStatus.Completed &&
                            t.Status !=
                                InventoryTaskStatus.Cancelled
                    )
                    .OrderBy(
                        t =>
                            t.DueDate
                    )
                    .Take(20)
                    .ToListAsync();

            foreach (
                var task
                in tasks
            )
            {
                var title =
                    $"Task Assigned: {task.Title}";

                var message =
                    task.DueDate.HasValue
                        ? $"You have been assigned '{task.Title}'. Due: {task.DueDate.Value:dd-MM-yyyy}."
                        : $"You have been assigned '{task.Title}'.";

                bool exists =
                    await _context.Notifications
                        .AnyAsync(
                            n =>
                                n.UserId ==
                                    user.Id &&
                                n.Type ==
                                    "Task" &&
                                n.Title ==
                                    title &&
                                n.Message ==
                                    message
                        );

                if (!exists)
                {
                    _context.Notifications.Add(
                        new Notification
                        {
                            UserId =
                                user.Id,

                            Type =
                                "Task",

                            Title =
                                title,

                            Message =
                                message,

                            IsRead =
                                false,

                            CreatedAt =
                                DateTime.Now
                        }
                    );
                }
            }
        }

        // =====================================================
        // ROLE HELPERS
        // =====================================================

        private static bool CanReceiveLowStockNotification(
            User user)
        {
            return
                user.NotifyLowStock &&
                (user.Role?.Name ==
                    "SuperAdmin" ||
                user.Role?.Name ==
                    "InventoryManager" ||
                user.Role?.Name ==
                    "WarehouseManager");
        }

        private static bool CanReceiveUserRequestNotification(
            User user)
        {
            return
                user.NotifyUserRequest &&
                user.Role?.Name ==
                    "SuperAdmin";
        }

        private static bool CanReceivePurchaseNotification(
            User user)
        {
            return
                user.NotifyPurchase &&
                (user.Role?.Name ==
                    "SuperAdmin" ||
                user.Role?.Name ==
                    "PurchaseOfficer");
        }

        // =====================================================
        // DTO
        // =====================================================

        private static NotificationDto ToDto(
            Notification notification)
        {
            return new NotificationDto
            {
                Id =
                    notification.Id,

                Type =
                    notification.Type,

                Title =
                    notification.Title,

                Message =
                    notification.Message,

                IsRead =
                    notification.IsRead,

                CreatedAt =
                    notification.CreatedAt
            };
        }
    }
}