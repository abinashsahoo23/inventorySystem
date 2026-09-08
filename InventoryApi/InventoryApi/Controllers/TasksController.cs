using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.DTOs;
using InventoryApi.Models;

// Explicitly use our application's TaskStatus enum.
// This avoids conflict with System.Threading.Tasks.TaskStatus.
using InventoryTaskStatus = InventoryApi.Models.TaskStatus;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/tasks")]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TasksController(
            AppDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET ALL TASKS
        // =====================================================

        [HttpGet]
        public async Task<IActionResult> GetTasks(
            [FromQuery] string? status = null)
        {
            var query =
                _context.Tasks
                    .AsNoTracking()
                    .Include(t => t.AssignedToUser)
                    .Include(t => t.CreatedByUser)
                    .AsQueryable();

            if (
                !string.IsNullOrWhiteSpace(status) &&
                Enum.TryParse<InventoryTaskStatus>(
                    status,
                    true,
                    out var parsedStatus
                )
            )
            {
                query = query.Where(
                    t =>
                        t.Status ==
                        parsedStatus
                );
            }

            var tasks =
                await query
                    .OrderByDescending(
                        t => t.CreatedAt
                    )
                    .Select(
                        t =>
                            new TaskDto
                            {
                                Id =
                                    t.Id,

                                Title =
                                    t.Title,

                                Description =
                                    t.Description,

                                AssignedToUserId =
                                    t.AssignedToUserId,

                                AssignedTo =
                                    t.AssignedToUser.Name,

                                CreatedByUserId =
                                    t.CreatedByUserId,

                                CreatedBy =
                                    t.CreatedByUser.Name,

                                Status =
                                    t.Status.ToString(),

                                DueDate =
                                    t.DueDate,

                                CreatedAt =
                                    t.CreatedAt,

                                UpdatedAt =
                                    t.UpdatedAt
                            }
                    )
                    .ToListAsync();

            return Ok(tasks);
        }

        // =====================================================
        // GET MY TASKS
        // =====================================================

        [HttpGet("my")]
        public async Task<IActionResult> GetMyTasks(
            [FromHeader(Name = "X-User-Email")]
            string userEmail,
            [FromQuery] string? status = null)
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

            var query =
                _context.Tasks
                    .AsNoTracking()
                    .Include(t => t.AssignedToUser)
                    .Include(t => t.CreatedByUser)
                    .Where(
                        t =>
                            t.AssignedToUserId ==
                            user.Id
                    );

            if (
                !string.IsNullOrWhiteSpace(status) &&
                Enum.TryParse<InventoryTaskStatus>(
                    status,
                    true,
                    out var parsedStatus
                )
            )
            {
                query = query.Where(
                    t =>
                        t.Status ==
                        parsedStatus
                );
            }

            var tasks =
                await query
                    .OrderBy(
                        t =>
                            t.DueDate
                    )
                    .ThenByDescending(
                        t =>
                            t.CreatedAt
                    )
                    .Select(
                        t =>
                            new TaskDto
                            {
                                Id =
                                    t.Id,

                                Title =
                                    t.Title,

                                Description =
                                    t.Description,

                                AssignedToUserId =
                                    t.AssignedToUserId,

                                AssignedTo =
                                    t.AssignedToUser.Name,

                                CreatedByUserId =
                                    t.CreatedByUserId,

                                CreatedBy =
                                    t.CreatedByUser.Name,

                                Status =
                                    t.Status.ToString(),

                                DueDate =
                                    t.DueDate,

                                CreatedAt =
                                    t.CreatedAt,

                                UpdatedAt =
                                    t.UpdatedAt
                            }
                    )
                    .ToListAsync();

            return Ok(tasks);
        }

        // =====================================================
        // GET ONE TASK
        // =====================================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOne(
            int id)
        {
            var task =
                await _context.Tasks
                    .AsNoTracking()
                    .Include(
                        t =>
                            t.AssignedToUser
                    )
                    .Include(
                        t =>
                            t.CreatedByUser
                    )
                    .FirstOrDefaultAsync(
                        t =>
                            t.Id ==
                            id
                    );

            if (task == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Task not found."
                    }
                );
            }

            return Ok(
                ToDto(task)
            );
        }

        // =====================================================
        // TASK HISTORY
        // =====================================================

        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetHistory(
            int id)
        {
            bool exists =
                await _context.Tasks
                    .AnyAsync(
                        t =>
                            t.Id ==
                            id
                    );

            if (!exists)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Task not found."
                    }
                );
            }

            var history =
                await _context.TaskHistory
                    .AsNoTracking()
                    .Include(
                        h =>
                            h.ChangedByUser
                    )
                    .Where(
                        h =>
                            h.TaskItemId ==
                            id
                    )
                    .OrderByDescending(
                        h =>
                            h.ChangedAt
                    )
                    .Select(
                        h =>
                            new TaskHistoryDto
                            {
                                Id =
                                    h.Id,

                                TaskId =
                                    h.TaskItemId,

                                OldStatus =
                                    h.OldStatus.ToString(),

                                NewStatus =
                                    h.NewStatus.ToString(),

                                ChangedBy =
                                    h.ChangedByUser.Name,

                                ChangedAt =
                                    h.ChangedAt
                            }
                    )
                    .ToListAsync();

            return Ok(history);
        }

        // =====================================================
        // CREATE TASK
        // =====================================================

        [HttpPost]
        public async Task<IActionResult> Create(
            CreateTaskDto dto,
            [FromHeader(Name = "X-User-Email")]
            string userEmail)
        {
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
                            "Task title is required."
                    }
                );
            }

            if (
                dto.AssignedToUserId <=
                0
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "A user must be assigned."
                    }
                );
            }

            var createdBy =
                await _context.Users
                    .FirstOrDefaultAsync(
                        u =>
                            u.Email ==
                            userEmail
                    );

            if (createdBy == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Current user not found."
                    }
                );
            }

            var assignedUser =
                await _context.Users
                    .Include(
                        u =>
                            u.Role
                    )
                    .FirstOrDefaultAsync(
                        u =>
                            u.Id ==
                            dto.AssignedToUserId
                    );

            if (assignedUser == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Assigned user not found."
                    }
                );
            }

            if (
                assignedUser.Status ==
                "Deactivated"
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "A deactivated user cannot receive a task."
                    }
                );
            }

            var task =
                new TaskItem
                {
                    Title =
                        dto.Title.Trim(),

                    Description =
                        dto.Description?
                            .Trim()
                        ?? string.Empty,

                    AssignedToUserId =
                        assignedUser.Id,

                    CreatedByUserId =
                        createdBy.Id,

                    Status =
                        InventoryTaskStatus.Pending,

                    DueDate =
                        dto.DueDate,

                    CreatedAt =
                        DateTime.Now,

                    UpdatedAt =
                        DateTime.Now
                };

            _context.Tasks.Add(task);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetOne),
                new
                {
                    id =
                        task.Id
                },
                await LoadTask(
                    task.Id
                )
            );
        }

        // =====================================================
        // UPDATE TASK
        // =====================================================

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            UpdateTaskDto dto)
        {
            var task =
                await _context.Tasks
                    .FirstOrDefaultAsync(
                        t =>
                            t.Id ==
                            id
                    );

            if (task == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Task not found."
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
                            "Task title is required."
                    }
                );
            }

            task.Title =
                dto.Title.Trim();

            task.Description =
                dto.Description?
                    .Trim()
                ?? string.Empty;

            task.DueDate =
                dto.DueDate;

            task.UpdatedAt =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(
                await LoadTask(
                    task.Id
                )
            );
        }

        // =====================================================
        // UPDATE STATUS
        // =====================================================

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(
            int id,
            UpdateTaskStatusDto dto,
            [FromHeader(Name = "X-User-Email")]
            string userEmail)
        {
            if (
                !Enum.TryParse<InventoryTaskStatus>(
                    dto.Status,
                    true,
                    out var newStatus
                )
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Invalid task status."
                    }
                );
            }

            var task =
                await _context.Tasks
                    .FirstOrDefaultAsync(
                        t =>
                            t.Id ==
                            id
                    );

            if (task == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Task not found."
                    }
                );
            }

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

            if (
                task.AssignedToUserId !=
                    user.Id &&
                task.CreatedByUserId !=
                    user.Id
            )
            {
                return Forbid();
            }

            if (
                task.Status ==
                newStatus
            )
            {
                return Ok(
                    await LoadTask(
                        task.Id
                    )
                );
            }

            var oldStatus =
                task.Status;

            task.Status =
                newStatus;

            task.UpdatedAt =
                DateTime.Now;

            _context.TaskHistory.Add(
                new TaskHistory
                {
                    TaskItemId =
                        task.Id,

                    OldStatus =
                        oldStatus,

                    NewStatus =
                        newStatus,

                    ChangedByUserId =
                        user.Id,

                    ChangedAt =
                        DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(
                await LoadTask(
                    task.Id
                )
            );
        }

        // =====================================================
        // DELETE TASK
        // =====================================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(
            int id)
        {
            var task =
                await _context.Tasks
                    .FirstOrDefaultAsync(
                        t =>
                            t.Id ==
                            id
                    );

            if (task == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Task not found."
                    }
                );
            }

            _context.Tasks.Remove(
                task
            );

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        "Task deleted."
                }
            );
        }

        // =====================================================
        // DTO MAPPING
        // =====================================================

        private static TaskDto ToDto(
            TaskItem task)
        {
            return new TaskDto
            {
                Id =
                    task.Id,

                Title =
                    task.Title,

                Description =
                    task.Description,

                AssignedToUserId =
                    task.AssignedToUserId,

                AssignedTo =
                    task.AssignedToUser?.Name
                    ?? string.Empty,

                CreatedByUserId =
                    task.CreatedByUserId,

                CreatedBy =
                    task.CreatedByUser?.Name
                    ?? string.Empty,

                Status =
                    task.Status.ToString(),

                DueDate =
                    task.DueDate,

                CreatedAt =
                    task.CreatedAt,

                UpdatedAt =
                    task.UpdatedAt
            };
        }

        private async Task<TaskDto?> LoadTask(
            int id)
        {
            var task =
                await _context.Tasks
                    .AsNoTracking()
                    .Include(
                        t =>
                            t.AssignedToUser
                    )
                    .Include(
                        t =>
                            t.CreatedByUser
                    )
                    .FirstOrDefaultAsync(
                        t =>
                            t.Id ==
                            id
                    );

            return task == null
                ? null
                : ToDto(task);
        }
    }
}