using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.DTOs;
using InventoryApi.Helpers;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // ACTIVITY LOG
        // =========================================================
        private async Task LogActivity(
            string targetName,
            string action,
            string userName,
            string userRole)
        {
            _context.ActivityLogs.Add(new ActivityLog
            {
                EntityType = "User",
                TargetName = targetName,
                Action = action,
                PerformedBy = string.IsNullOrWhiteSpace(userName)
                    ? "Unknown"
                    : userName,
                PerformedByRole = string.IsNullOrWhiteSpace(userRole)
                    ? "Admin"
                    : userRole
            });

            await _context.SaveChangesAsync();
        }

        // =========================================================
        // GET ALL USERS
        // =========================================================
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .Include(u => u.Role)
                .Select(u => new UserResponseDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Phone = u.Phone,
                    RoleId = u.RoleId,
                    Role = u.Role != null ? u.Role.Name : null,
                    Status = u.Status
                })
                .ToListAsync();

            return Ok(users);
        }

        // =========================================================
        // GET PENDING USERS
        // =========================================================
        [HttpGet("pending")]
        public async Task<IActionResult> GetPending()
        {
            var users = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Status == "Pending")
                .Select(u => new UserResponseDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Phone = u.Phone,
                    RoleId = u.RoleId,
                    Role = u.Role != null ? u.Role.Name : null,
                    Status = u.Status
                })
                .ToListAsync();

            return Ok(users);
        }

        // =========================================================
        // CREATE USER
        // =========================================================
        [HttpPost]
        public async Task<IActionResult> Create(
            AdminCreateUserDto dto,
            [FromHeader(Name = "X-User-Name")] string userName,
            [FromHeader(Name = "X-User-Role")] string userRole)
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(dto.Name) ||
                string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.Phone) ||
                string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new
                {
                    message = "Name, email, phone and password are all required."
                });
            }

            // Validate email
            if (!Validation.IsValidEmail(dto.Email))
            {
                return BadRequest(new
                {
                    message = "Please enter a valid email address."
                });
            }

            // Validate phone
            if (!Validation.IsValidPhone(dto.Phone))
            {
                return BadRequest(new
                {
                    message = "Phone number must be exactly 10 digits."
                });
            }

            // Validate password
            var passwordError = Validation.PasswordError(dto.Password);

            if (passwordError != null)
            {
                return BadRequest(new
                {
                    message = passwordError
                });
            }

            // Check duplicate email
            bool exists = await _context.Users
                .AnyAsync(u => u.Email == dto.Email);

            if (exists)
            {
                return BadRequest(new
                {
                    message = "An account with this email already exists."
                });
            }

            // Create user
            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                Password = dto.Password,
                RoleId = dto.RoleId,
                Status = "Approved"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Load role information
            await _context.Entry(user)
                .Reference(u => u.Role)
                .LoadAsync();

            // Log activity
            await LogActivity(
                user.Name,
                "Added",
                userName,
                userRole);

            // Return response
            return Ok(new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                RoleId = user.RoleId,
                Role = user.Role != null ? user.Role.Name : null,
                Status = user.Status
            });
        }

        // =========================================================
        // UPDATE USER
        // =========================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            UpdateUserDto dto,
            [FromHeader(Name = "X-User-Name")] string userName,
            [FromHeader(Name = "X-User-Role")] string userRole)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            // Validate email
            if (!Validation.IsValidEmail(dto.Email))
            {
                return BadRequest(new
                {
                    message = "Please enter a valid email address."
                });
            }

            // Validate phone
            if (!Validation.IsValidPhone(dto.Phone))
            {
                return BadRequest(new
                {
                    message = "Phone number must be exactly 10 digits."
                });
            }

            // Update user
            user.Name = dto.Name;
            user.Email = dto.Email;
            user.Phone = dto.Phone;
            user.RoleId = dto.RoleId;


            await _context.SaveChangesAsync();

            // Load role
            await _context.Entry(user)
                .Reference(u => u.Role)
                .LoadAsync();

            // Log activity
            await LogActivity(
                user.Name,
                "Updated",
                userName,
                userRole);

            return Ok(new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                RoleId = user.RoleId,
                Role = user.Role != null ? user.Role.Name : null,
                Status = user.Status
            });
        }

        // =========================================================
        // MY PROFILE (SELF-SERVICE — name/phone only, not email/role)
        // =========================================================

        [HttpGet("me")]
        public async Task<IActionResult> GetMyAccountInfo(
            [FromHeader(Name = "X-User-Email")] string loggedInEmail)
        {
            if (string.IsNullOrWhiteSpace(loggedInEmail))
            {
                return BadRequest(new
                {
                    message = "You must be logged in to view account info."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == loggedInEmail);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "Account not found."
                });
            }

            return Ok(new AccountInfoDto
            {
                Status = user.Status,
                CreatedAt = user.CreatedAt
            });
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile(
            UpdateMyProfileDto dto,
            [FromHeader(Name = "X-User-Email")] string loggedInEmail,
            [FromHeader(Name = "X-User-Role")] string userRole)
        {
            if (string.IsNullOrWhiteSpace(loggedInEmail))
            {
                return BadRequest(new
                {
                    message = "You must be logged in to update your profile."
                });
            }

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == loggedInEmail);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "Account not found."
                });
            }

            var name = dto.Name.Trim();
            var phone = dto.Phone.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new
                {
                    message = "Name is required."
                });
            }

            if (!Validation.IsValidPhone(phone))
            {
                return BadRequest(new
                {
                    message = "Phone number must be exactly 10 digits."
                });
            }

            // Only Name and Phone can change here — Email is the login
            // identifier (changed only via the password/security flow)
            // and RoleId is admin-only, set through the Users admin page.
            user.Name = name;
            user.Phone = phone;

            await _context.SaveChangesAsync();

            await LogActivity(
                user.Name,
                "Updated Own Profile",
                user.Name,
                userRole);

            return Ok(new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                RoleId = user.RoleId,
                Role = user.Role != null ? user.Role.Name : null,
                Status = user.Status
            });
        }

        // =========================================================
        // APPROVE USER
        // =========================================================
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> Approve(
            int id,
            [FromHeader(Name = "X-User-Name")] string userName,
            [FromHeader(Name = "X-User-Role")] string userRole)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            user.Status = "Approved";

            await _context.SaveChangesAsync();

            await LogActivity(
                user.Name,
                "Approved",
                userName,
                userRole);

            return Ok(new
            {
                message = $"{user.Name} approved."
            });
        }

        // =========================================================
        // DELETE USER
        // =========================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(
            int id,
            [FromHeader(Name = "X-User-Name")] string userName,
            [FromHeader(Name = "X-User-Role")] string userRole)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            _context.Users.Remove(user);

            await _context.SaveChangesAsync();

            await LogActivity(
                user.Name,
                "Deleted",
                userName,
                userRole);

            return Ok(new
            {
                message = $"{user.Name} removed."
            });
        }

        // =========================================================
        // DEACTIVATE USER
        // =========================================================
        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(
            int id,
            [FromHeader(Name = "X-User-Name")] string userName,
            [FromHeader(Name = "X-User-Role")] string userRole)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            user.Status = "Deactivated";

            await _context.SaveChangesAsync();

            await LogActivity(
                user.Name,
                "Deactivated",
                userName,
                userRole);

            return Ok(new
            {
                message = $"{user.Name} has been deactivated."
            });
        }

        // =========================================================
        // ACTIVATE USER
        // =========================================================
        [HttpPut("{id}/activate")]
        public async Task<IActionResult> Activate(
            int id,
            [FromHeader(Name = "X-User-Name")] string userName,
            [FromHeader(Name = "X-User-Role")] string userRole)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            user.Status = "Approved";

            await _context.SaveChangesAsync();

            await LogActivity(
                user.Name,
                "Activated",
                userName,
                userRole);

            return Ok(new
            {
                message = $"{user.Name} has been activated."
            });
        }

        // =========================================================
        // ASSIGN ROLE
        // =========================================================
        [HttpPut("{id}/role")]
        public async Task<IActionResult> AssignRole(
            int id,
            AssignRoleDto dto,
            [FromHeader(Name = "X-User-Name")] string userName,
            [FromHeader(Name = "X-User-Role")] string userRole)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var newRole = await _context.Roles
                .FindAsync(dto.RoleId);

            if (newRole == null)
            {
                return BadRequest(new
                {
                    message = "That role doesn't exist."
                });
            }

            var oldRoleName = user.Role != null
                ? user.Role.Name
                : "Unknown";

            user.RoleId = dto.RoleId;

            await _context.SaveChangesAsync();

            await LogActivity(
                user.Name,
                $"Role changed: {oldRoleName} -> {newRole.Name}",
                userName,
                userRole);

            return Ok(new
            {
                message = $"{user.Name}'s role changed to {newRole.Name}."
            });
        }

        // =========================================================
        // CHANGE PASSWORD
        // =========================================================
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword(
            ChangePasswordDto dto,
            [FromHeader(Name = "X-User-Name")] string userName,
            [FromHeader(Name = "X-User-Role")] string userRole,
            [FromHeader(Name = "X-User-Email")] string loggedInEmail)
        {
            // Check logged in email
            if (!string.IsNullOrWhiteSpace(loggedInEmail) &&
                !string.Equals(
                    dto.Email,
                    loggedInEmail,
                    StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message = "Email doesn't match your logged-in account."
                });
            }

            // Find user
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "No account found with that email."
                });
            }

            // Check current password
            if (user.Password != dto.CurrentPassword)
            {
                return BadRequest(new
                {
                    message = "Current password is incorrect."
                });
            }

            // Validate new password
            var passwordError = Validation.PasswordError(dto.NewPassword);

            if (passwordError != null)
            {
                return BadRequest(new
                {
                    message = passwordError
                });
            }

            // Prevent same password
            if (dto.NewPassword == dto.CurrentPassword)
            {
                return BadRequest(new
                {
                    message = "New password must be different from the current one."
                });
            }

            // Change password
            user.Password = dto.NewPassword;

            await _context.SaveChangesAsync();

            await LogActivity(
                user.Name,
                "Changed Password",
                userName,
                userRole);

            return Ok(new
            {
                message = "Password updated successfully."
            });
        }
    }
}