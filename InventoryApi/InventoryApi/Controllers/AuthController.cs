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
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AuthController(AppDbContext context) => _context = context;

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) ||
                string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.Phone) ||
                string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { message = "Name, email, phone and password are all required." });

            if (!Validation.IsValidEmail(dto.Email))
                return BadRequest(new { message = "Please enter a valid email address." });

            if (!Validation.IsValidPhone(dto.Phone))
                return BadRequest(new { message = "Phone number must be exactly 10 digits." });

            var passwordError = Validation.PasswordError(dto.Password);
            if (passwordError != null)
                return BadRequest(new { message = passwordError });

            bool exists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (exists)
                return BadRequest(new { message = "An account with this email already exists." });

            var unassigned = await _context.Roles.FirstAsync(r => r.Name == "Unassigned");

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                Password = dto.Password,
                RoleId = unassigned.Id,
                Status = "Pending"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registered. Your account is pending admin approval." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Password == dto.Password);

            if (user == null)
                return Unauthorized(new { message = "Wrong email or password." });

            if (user.Role.Name != "SuperAdmin")
            {
                if (user.Status == "Pending")
                    return StatusCode(403, new { message = "Your account is pending admin approval." });
                if (user.Status == "Deactivated")
                    return StatusCode(403, new { message = "Your account has been deactivated. Contact your administrator." });
            }

            var response = new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                RoleId = user.RoleId,
                Role = user.Role.Name,
                Status = user.Status
            };

            return Ok(response);
        }
    }
}