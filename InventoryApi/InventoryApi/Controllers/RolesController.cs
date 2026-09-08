using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.DTOs;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public RolesController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var roles = await _context.Roles
                .Select(r => new RoleDto { Id = r.Id, Name = r.Name, Description = r.Description })
                .ToListAsync();
            return Ok(roles);
        }

        [HttpGet("permissions")]
        public async Task<IActionResult> GetAllPermissions()
        {
            var permissions = await _context.Permissions
                .OrderBy(p => p.Module).ThenBy(p => p.Name)
                .Select(p => new PermissionDto { Id = p.Id, Name = p.Name, Module = p.Module })
                .ToListAsync();
            return Ok(permissions);
        }

        [HttpGet("{id}/permissions")]
        public async Task<IActionResult> GetRolePermissions(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound();

            var grantedIds = await _context.RolePermissions
                .Where(rp => rp.RoleId == id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            return Ok(new RolePermissionsDto
            {
                RoleId = role.Id,
                RoleName = role.Name,
                GrantedPermissionIds = grantedIds
            });
        }

        [HttpPut("{id}/permissions")]
        public async Task<IActionResult> UpdateRolePermissions(
            int id,
            UpdateRolePermissionsDto dto,
            [FromHeader(Name = "X-User-Name")] string userName,
            [FromHeader(Name = "X-User-Role")] string userRole)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound();

            var existing = _context.RolePermissions.Where(rp => rp.RoleId == id);
            _context.RolePermissions.RemoveRange(existing);

            foreach (var permId in dto.PermissionIds.Distinct())
                _context.RolePermissions.Add(new RolePermission { RoleId = id, PermissionId = permId });

            _context.ActivityLogs.Add(new ActivityLog
            {
                EntityType = "Role",
                TargetName = role.Name,
                Action = "Permissions updated",
                PerformedBy = string.IsNullOrWhiteSpace(userName) ? "Unknown" : userName,
                PerformedByRole = string.IsNullOrWhiteSpace(userRole) ? "SuperAdmin" : userRole
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Permissions updated for {role.Name}." });
        }
    }
}