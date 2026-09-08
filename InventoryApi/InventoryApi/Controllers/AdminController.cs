using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.DTOs;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var totalUsers =
                await _context.Users.CountAsync();

            var pendingUsers =
                await _context.Users.CountAsync(
                    u => u.Status == "Pending"
                );

            var approvedUsers =
                await _context.Users.CountAsync(
                    u => u.Status == "Approved"
                );

            var usersByRole =
                await _context.Users
                    .Include(u => u.Role)
                    .GroupBy(u => u.Role.Name)
                    .Select(
                        g => new RoleCountDto
                        {
                            Role = g.Key,
                            Count = g.Count()
                        }
                    )
                    .OrderByDescending(
                        x => x.Count
                    )
                    .ToListAsync();

            var products =
                await _context.Products
                    .AsNoTracking()
                    .Select(
                        p => new
                        {
                            p.Id,
                            p.Name,
                            p.SKU,
                            p.Category,
                            p.Price,
                            p.MinimumStockLevel,
                            TotalStock =
                                _context.ProductStocks
                                    .Where(
                                        ps =>
                                            ps.ProductId ==
                                            p.Id
                                    )
                                    .Sum(
                                        ps =>
                                            (int?)
                                                ps.Quantity
                                    ) ?? 0
                        }
                    )
                    .ToListAsync();

            var activeProducts =
                products
                    .Where(p => p.Id > 0)
                    .ToList();

            var totalProducts =
                activeProducts.Count;

            var outOfStock =
                activeProducts.Count(
                    p =>
                        p.TotalStock == 0
                );

            var lowStock =
                activeProducts.Count(
                    p =>
                        p.TotalStock > 0 &&
                        p.TotalStock <=
                            p.MinimumStockLevel
                );

            var stockValue =
                activeProducts.Sum(
                    p =>
                        p.TotalStock *
                        p.Price
                );

            var lowStockItems =
                activeProducts
                    .Where(
                        p =>
                            p.TotalStock <=
                            p.MinimumStockLevel
                    )
                    .OrderBy(
                        p =>
                            p.TotalStock
                    )
                    .ThenBy(
                        p =>
                            p.Name
                    )
                    .Take(100)
                    .Select(
                        p =>
                            new LowStockProductDto
                            {
                                ProductId =
                                    p.Id,

                                ProductName =
                                    p.Name,

                                SKU =
                                    p.SKU ?? "",

                                Category =
                                    p.Category,

                                CurrentStock =
                                    p.TotalStock,

                                MinimumStock =
                                    p.MinimumStockLevel,

                                OutOfStock =
                                    p.TotalStock == 0
                            }
                    )
                    .ToList();

            var recentActivity =
                await _context.ActivityLogs
                    .AsNoTracking()
                    .OrderByDescending(
                        l =>
                            l.Timestamp
                    )
                    .Take(100)
                    .Select(
                        l =>
                            new RecentActivityDto
                            {
                                EntityType =
                                    l.EntityType,

                                TargetName =
                                    l.TargetName,

                                Action =
                                    l.Action,

                                PerformedBy =
                                    l.PerformedBy,

                                PerformedByRole =
                                    l.PerformedByRole,

                                Timestamp =
                                    l.Timestamp
                            }
                    )
                    .ToListAsync();

            return Ok(
                new AdminOverviewDto
                {
                    TotalUsers =
                        totalUsers,

                    PendingUsers =
                        pendingUsers,

                    ApprovedUsers =
                        approvedUsers,

                    UsersByRole =
                        usersByRole,

                    TotalProducts =
                        totalProducts,

                    OutOfStockProducts =
                        outOfStock,

                    LowStockProducts =
                        lowStock,

                    TotalStockValue =
                        stockValue,

                    LowStockItems =
                        lowStockItems,

                    RecentActivity =
                        recentActivity
                }
            );
        }
    }
}