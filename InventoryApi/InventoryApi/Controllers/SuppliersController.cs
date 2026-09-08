using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.DTOs;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SuppliersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SuppliersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search = null,
            [FromQuery] bool activeOnly = false)
        {
            var query =
                _context.Suppliers
                    .AsNoTracking()
                    .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var value =
                    search.Trim().ToLower();

                query = query.Where(
                    s =>
                        s.Name.ToLower().Contains(value) ||
                        s.ContactPerson
                            .ToLower()
                            .Contains(value) ||
                        s.Phone.Contains(value) ||
                        s.Email
                            .ToLower()
                            .Contains(value)
                );
            }

            if (activeOnly)
            {
                query = query.Where(
                    s => s.IsActive
                );
            }

            var suppliers =
                await query
                    .OrderBy(s => s.Name)
                    .Select(
                        s =>
                            new SupplierDto
                            {
                                Id = s.Id,

                                Name = s.Name,

                                ContactPerson =
                                    s.ContactPerson,

                                Phone = s.Phone,

                                Email = s.Email,

                                Address = s.Address,

                                IsActive =
                                    s.IsActive,

                                CreatedAt =
                                    s.CreatedAt,

                                PurchaseCount =
                                    _context.PurchaseOrders
                                        .Count(
                                            po =>
                                                po.SupplierId ==
                                                s.Id
                                        ),

                                TotalPurchaseAmount =
                                    _context.PurchaseOrders
                                        .Where(
                                            po =>
                                                po.SupplierId ==
                                                s.Id
                                        )
                                        .SelectMany(
                                            po =>
                                                po.Items
                                        )
                                        .Sum(
                                            i =>
                                                (decimal?)
                                                    (
                                                        i.Quantity *
                                                        i.UnitPrice
                                                    )
                                        ) ?? 0
                            }
                    )
                    .ToListAsync();

            return Ok(suppliers);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOne(
            int id)
        {
            var supplier =
                await _context.Suppliers
                    .AsNoTracking()
                    .Where(
                        s => s.Id == id
                    )
                    .Select(
                        s =>
                            new SupplierDto
                            {
                                Id = s.Id,

                                Name = s.Name,

                                ContactPerson =
                                    s.ContactPerson,

                                Phone = s.Phone,

                                Email = s.Email,

                                Address = s.Address,

                                IsActive =
                                    s.IsActive,

                                CreatedAt =
                                    s.CreatedAt,

                                PurchaseCount =
                                    _context.PurchaseOrders
                                        .Count(
                                            po =>
                                                po.SupplierId ==
                                                s.Id
                                        ),

                                TotalPurchaseAmount =
                                    _context.PurchaseOrders
                                        .Where(
                                            po =>
                                                po.SupplierId ==
                                                s.Id
                                        )
                                        .SelectMany(
                                            po =>
                                                po.Items
                                        )
                                        .Sum(
                                            i =>
                                                (decimal?)
                                                    (
                                                        i.Quantity *
                                                        i.UnitPrice
                                                    )
                                        ) ?? 0
                            }
                    )
                    .FirstOrDefaultAsync();

            if (supplier == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Supplier not found."
                    }
                );
            }

            return Ok(supplier);
        }

        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetHistory(
            int id)
        {
            bool supplierExists =
                await _context.Suppliers.AnyAsync(
                    s => s.Id == id
                );

            if (!supplierExists)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Supplier not found."
                    }
                );
            }

            var history =
                await _context.PurchaseOrders
                    .AsNoTracking()
                    .Where(
                        po =>
                            po.SupplierId == id
                    )
                    .OrderByDescending(
                        po => po.OrderDate
                    )
                    .Select(
                        po =>
                            new SupplierHistoryDto
                            {
                                PurchaseOrderId =
                                    po.Id,

                                Status =
                                    po.Status.ToString(),

                                OrderDate =
                                    po.OrderDate,

                                ReceivedDate =
                                    po.ReceivedDate,

                                WarehouseName =
                                    po.Warehouse.Name,

                                CreatedBy =
                                    po.CreatedBy,

                                TotalAmount =
                                    po.Items.Sum(
                                        i =>
                                            i.Quantity *
                                            i.UnitPrice
                                    ),

                                ItemCount =
                                    po.Items.Count
                            }
                    )
                    .ToListAsync();

            return Ok(history);
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            SupplierInputDto dto)
        {
            var name =
                dto.Name?.Trim();

            if (
                string.IsNullOrWhiteSpace(name)
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Supplier name is required."
                    }
                );
            }

            bool exists =
                await _context.Suppliers.AnyAsync(
                    s =>
                        s.Name.ToLower() ==
                        name.ToLower()
                );

            if (exists)
            {
                return Conflict(
                    new
                    {
                        message =
                            "A supplier with this name already exists."
                    }
                );
            }

            var supplier =
                new Supplier
                {
                    Name = name,

                    ContactPerson =
                        dto.ContactPerson?.Trim()
                        ?? string.Empty,

                    Phone =
                        dto.Phone?.Trim()
                        ?? string.Empty,

                    Email =
                        dto.Email?.Trim()
                        ?? string.Empty,

                    Address =
                        dto.Address?.Trim()
                        ?? string.Empty,

                    IsActive = true
                };

            _context.Suppliers.Add(
                supplier
            );

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetOne),
                new
                {
                    id = supplier.Id
                },
                new SupplierDto
                {
                    Id = supplier.Id,
                    Name = supplier.Name,
                    ContactPerson =
                        supplier.ContactPerson,
                    Phone = supplier.Phone,
                    Email = supplier.Email,
                    Address = supplier.Address,
                    IsActive =
                        supplier.IsActive,
                    CreatedAt =
                        supplier.CreatedAt,
                    PurchaseCount = 0,
                    TotalPurchaseAmount = 0
                }
            );
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            SupplierInputDto dto)
        {
            var supplier =
                await _context.Suppliers
                    .FindAsync(id);

            if (supplier == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Supplier not found."
                    }
                );
            }

            var name =
                dto.Name?.Trim();

            if (
                string.IsNullOrWhiteSpace(name)
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Supplier name is required."
                    }
                );
            }

            bool exists =
                await _context.Suppliers.AnyAsync(
                    s =>
                        s.Id != id &&
                        s.Name.ToLower() ==
                        name.ToLower()
                );

            if (exists)
            {
                return Conflict(
                    new
                    {
                        message =
                            "A supplier with this name already exists."
                    }
                );
            }

            supplier.Name = name;

            supplier.ContactPerson =
                dto.ContactPerson?.Trim()
                ?? string.Empty;

            supplier.Phone =
                dto.Phone?.Trim()
                ?? string.Empty;

            supplier.Email =
                dto.Email?.Trim()
                ?? string.Empty;

            supplier.Address =
                dto.Address?.Trim()
                ?? string.Empty;

            await _context.SaveChangesAsync();

            return Ok(
                await BuildSupplierDto(
                    supplier.Id
                )
            );
        }

        [HttpPut("{id}/activate")]
        public async Task<IActionResult> Activate(
            int id)
        {
            var supplier =
                await _context.Suppliers
                    .FindAsync(id);

            if (supplier == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Supplier not found."
                    }
                );
            }

            supplier.IsActive = true;

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        "Supplier activated."
                }
            );
        }

        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(
            int id)
        {
            var supplier =
                await _context.Suppliers
                    .FindAsync(id);

            if (supplier == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Supplier not found."
                    }
                );
            }

            supplier.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        "Supplier deactivated."
                }
            );
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(
            int id)
        {
            var supplier =
                await _context.Suppliers
                    .FindAsync(id);

            if (supplier == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Supplier not found."
                    }
                );
            }

            bool hasOrders =
                await _context.PurchaseOrders
                    .AnyAsync(
                        po =>
                            po.SupplierId == id
                    );

            if (hasOrders)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Cannot delete a supplier with existing purchase orders. Deactivate it instead."
                    }
                );
            }

            _context.Suppliers.Remove(
                supplier
            );

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        "Supplier deleted."
                }
            );
        }

        private async Task<SupplierDto?> BuildSupplierDto(
            int id)
        {
            return await _context.Suppliers
                .AsNoTracking()
                .Where(s => s.Id == id)
                .Select(
                    s =>
                        new SupplierDto
                        {
                            Id = s.Id,
                            Name = s.Name,
                            ContactPerson =
                                s.ContactPerson,
                            Phone = s.Phone,
                            Email = s.Email,
                            Address = s.Address,
                            IsActive =
                                s.IsActive,
                            CreatedAt =
                                s.CreatedAt,
                            PurchaseCount =
                                _context.PurchaseOrders
                                    .Count(
                                        po =>
                                            po.SupplierId ==
                                            s.Id
                                    ),
                            TotalPurchaseAmount =
                                _context.PurchaseOrders
                                    .Where(
                                        po =>
                                            po.SupplierId ==
                                            s.Id
                                    )
                                    .SelectMany(
                                        po =>
                                            po.Items
                                    )
                                    .Sum(
                                        i =>
                                            (decimal?)
                                                (
                                                    i.Quantity *
                                                    i.UnitPrice
                                                )
                                    ) ?? 0
                        }
                )
                .FirstOrDefaultAsync();
        }
    }
}