using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.DTOs;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WarehousesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WarehousesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var warehouses =
                await _context.Warehouses
                    .AsNoTracking()
                    .OrderBy(w => w.Name)
                    .Select(w => new WarehouseDto
                    {
                        Id = w.Id,
                        Name = w.Name,
                        Location = w.Location,
                        IsActive = w.IsActive,
                        EmployeeCount = w.Employees.Count(
                            u => u.Status != "Deactivated"
                        ),
                        TotalStock = w.ProductStocks
                            .Where(ps => ps.Product.IsActive)
                            .Sum(ps => (int?)ps.Quantity) ?? 0
                    })
                    .ToListAsync();

            return Ok(warehouses);
        }

        [HttpGet("{id}/stock")]
        public async Task<IActionResult> GetStock(int id)
        {
            bool exists =
                await _context.Warehouses.AnyAsync(w => w.Id == id);

            if (!exists)
            {
                return NotFound(new
                {
                    message = "Warehouse not found."
                });
            }

            var stock =
                await _context.ProductStocks
                    .AsNoTracking()
                    .Include(ps => ps.Product)
                    .Where(ps =>
                        ps.WarehouseId == id &&
                        ps.Product.IsActive
                    )
                    .OrderBy(ps => ps.Product.Name)
                    .Select(ps => new
                    {
                        productId = ps.ProductId,
                        productName = ps.Product.Name,
                        sku = ps.Product.SKU,
                        quantity = ps.Quantity,
                        minimumStockLevel =
                            ps.Product.MinimumStockLevel
                    })
                    .ToListAsync();

            return Ok(stock);
        }

        [HttpGet("{id}/employees")]
        public async Task<IActionResult> GetEmployees(int id)
        {
            bool exists =
                await _context.Warehouses.AnyAsync(w => w.Id == id);

            if (!exists)
            {
                return NotFound(new
                {
                    message = "Warehouse not found."
                });
            }

            var employees =
                await _context.Users
                    .AsNoTracking()
                    .Include(u => u.Role)
                    .Where(u => u.WarehouseId == id)
                    .OrderBy(u => u.Name)
                    .Select(u => new WarehouseEmployeeDto
                    {
                        Id = u.Id,
                        Name = u.Name,
                        Email = u.Email,
                        Phone = u.Phone,
                        Role = u.Role.Name,
                        Status = u.Status
                    })
                    .ToListAsync();

            return Ok(employees);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateWarehouseDto dto)
        {
            var name = dto.Name?.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new
                {
                    message = "Warehouse name is required."
                });
            }

            bool exists =
                await _context.Warehouses.AnyAsync(w =>
                    w.Name.ToLower() == name.ToLower()
                );

            if (exists)
            {
                return Conflict(new
                {
                    message = "Warehouse already exists."
                });
            }

            var warehouse = new Models.Warehouse
            {
                Name = name,
                Location = dto.Location?.Trim() ?? string.Empty,
                IsActive = true
            };

            _context.Warehouses.Add(warehouse);
            await _context.SaveChangesAsync();

            return Ok(new WarehouseDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Location = warehouse.Location,
                IsActive = warehouse.IsActive,
                EmployeeCount = 0,
                TotalStock = 0
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            UpdateWarehouseDto dto)
        {
            var warehouse =
                await _context.Warehouses.FindAsync(id);

            if (warehouse == null)
            {
                return NotFound(new
                {
                    message = "Warehouse not found."
                });
            }

            var name = dto.Name?.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new
                {
                    message = "Warehouse name is required."
                });
            }

            bool duplicate =
                await _context.Warehouses.AnyAsync(w =>
                    w.Id != id &&
                    w.Name.ToLower() == name.ToLower()
                );

            if (duplicate)
            {
                return Conflict(new
                {
                    message = "Warehouse already exists."
                });
            }

            warehouse.Name = name;
            warehouse.Location = dto.Location?.Trim() ?? string.Empty;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Warehouse updated successfully."
            });
        }

        [HttpPut("{id}/employees")]
        public async Task<IActionResult> AssignEmployee(
            int id,
            AssignWarehouseEmployeeDto dto)
        {
            var warehouse =
                await _context.Warehouses
                    .FirstOrDefaultAsync(w => w.Id == id);

            if (warehouse == null)
            {
                return NotFound(new
                {
                    message = "Warehouse not found."
                });
            }

            if (!warehouse.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "Inactive warehouses cannot receive new employees."
                });
            }

            var user =
                await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Id == dto.UserId);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            if (user.Status == "Deactivated")
            {
                return BadRequest(new
                {
                    message =
                        "Deactivated users cannot be assigned to a warehouse."
                });
            }

            var allowedRoles = new[]
            {
                "WarehouseManager",
                "Staff"
            };

            if (!allowedRoles.Contains(user.Role.Name))
            {
                return BadRequest(new
                {
                    message =
                        "Only WarehouseManager and Staff can be assigned as warehouse employees."
                });
            }

            user.WarehouseId = warehouse.Id;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"{user.Name} assigned to {warehouse.Name}."
            });
        }

        [HttpDelete("{id}/employees/{userId}")]
        public async Task<IActionResult> RemoveEmployee(
            int id,
            int userId)
        {
            var user =
                await _context.Users.FirstOrDefaultAsync(u =>
                    u.Id == userId &&
                    u.WarehouseId == id
                );

            if (user == null)
            {
                return NotFound(new
                {
                    message = "Warehouse employee not found."
                });
            }

            user.WarehouseId = null;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"{user.Name} removed from the warehouse."
            });
        }

        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var warehouse =
                await _context.Warehouses.FindAsync(id);

            if (warehouse == null)
            {
                return NotFound(new
                {
                    message = "Warehouse not found."
                });
            }

            warehouse.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Warehouse deactivated."
            });
        }

        [HttpPut("{id}/activate")]
        public async Task<IActionResult> Activate(int id)
        {
            var warehouse =
                await _context.Warehouses.FindAsync(id);

            if (warehouse == null)
            {
                return NotFound(new
                {
                    message = "Warehouse not found."
                });
            }

            warehouse.IsActive = true;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Warehouse activated."
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var warehouse =
                await _context.Warehouses
                    .Include(w => w.ProductStocks)
                    .Include(w => w.Employees)
                    .FirstOrDefaultAsync(w => w.Id == id);

            if (warehouse == null)
            {
                return NotFound(new
                {
                    message = "Warehouse not found."
                });
            }

            bool hasStock = warehouse.ProductStocks.Any(
                ps => ps.Quantity > 0
            );

            if (hasStock)
            {
                return BadRequest(new
                {
                    message =
                        "Warehouse cannot be deleted while stock exists. Deactivate it instead."
                });
            }

            if (warehouse.Employees.Any())
            {
                return BadRequest(new
                {
                    message =
                        "Warehouse cannot be deleted while employees are assigned. Remove the employees or deactivate the warehouse instead."
                });
            }

            string warehouseName = warehouse.Name;

            _context.Warehouses.Remove(warehouse);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"{warehouseName} deleted."
            });
        }
    }
}
