using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.DTOs;
using InventoryApi.Models;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/reports")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        private const int DefaultLowStockThreshold = 10;

        public ReportsController(
            AppDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // INVENTORY REPORT
        // =====================================================

        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventoryReport()
        {
            var products =
                await _context.Products
                    .AsNoTracking()
                    .OrderBy(
                        p => p.Name
                    )
                    .ToListAsync();

            var result =
                new List<InventoryReportDto>();

            foreach (
                var product in products
            )
            {
                var totalStock =
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

                result.Add(
                    new InventoryReportDto
                    {
                        ProductId =
                            product.Id,

                        ProductName =
                            product.Name,

                        Category =
                            product.Category,

                        Price =
                            product.Price,

                        TotalStock =
                            totalStock,

                        InventoryValue =
                            totalStock *
                            product.Price
                    }
                );
            }

            return Ok(result);
        }

        // =====================================================
        // SALES REPORT
        // =====================================================

        [HttpGet("sales")]
        public async Task<IActionResult> GetSalesReport(
            [FromQuery] string? status = null)
        {
            var query =
                _context.SalesOrders
                    .AsNoTracking()
                    .Include(
                        so =>
                            so.Customer
                    )
                    .Include(
                        so =>
                            so.Warehouse
                    )
                    .Include(
                        so =>
                            so.Items
                    )
                    .AsQueryable();

            if (
                !string.IsNullOrWhiteSpace(
                    status
                ) &&
                Enum.TryParse<SalesOrderStatus>(
                    status,
                    true,
                    out var parsedStatus
                )
            )
            {
                query =
                    query.Where(
                        so =>
                            so.Status ==
                            parsedStatus
                    );
            }

            var orders =
                await query
                    .OrderByDescending(
                        so =>
                            so.OrderDate
                    )
                    .ToListAsync();

            var result =
                orders.Select(
                    so =>
                        new SalesReportDto
                        {
                            OrderId =
                                so.Id,

                            CustomerName =
                                so.Customer?.Name
                                ?? string.Empty,

                            WarehouseName =
                                so.Warehouse?.Name
                                ?? string.Empty,

                            Status =
                                so.Status.ToString(),

                            OrderDate =
                                so.OrderDate,

                            CompletedDate =
                                so.CompletedDate,

                            InvoiceNumber =
                                so.InvoiceNumber
                                ?? string.Empty,

                            CreatedBy =
                                so.CreatedBy,

                            TotalAmount =
                                so.Items.Sum(
                                    i =>
                                        i.Quantity *
                                        i.UnitPrice
                                ),

                            ItemCount =
                                so.Items.Count
                        }
                );

            return Ok(result);
        }

        // =====================================================
        // PURCHASE REPORT
        // =====================================================

        [HttpGet("purchases")]
        public async Task<IActionResult> GetPurchaseReport(
            [FromQuery] string? status = null)
        {
            var query =
                _context.PurchaseOrders
                    .AsNoTracking()
                    .Include(
                        po =>
                            po.Supplier
                    )
                    .Include(
                        po =>
                            po.Warehouse
                    )
                    .Include(
                        po =>
                            po.Items
                    )
                    .AsQueryable();

            if (
                !string.IsNullOrWhiteSpace(
                    status
                ) &&
                Enum.TryParse<PurchaseOrderStatus>(
                    status,
                    true,
                    out var parsedStatus
                )
            )
            {
                query =
                    query.Where(
                        po =>
                            po.Status ==
                            parsedStatus
                    );
            }

            var orders =
                await query
                    .OrderByDescending(
                        po =>
                            po.OrderDate
                    )
                    .ToListAsync();

            var result =
                orders.Select(
                    po =>
                        new PurchaseReportDto
                        {
                            OrderId =
                                po.Id,

                            SupplierName =
                                po.Supplier?.Name
                                ?? string.Empty,

                            WarehouseName =
                                po.Warehouse?.Name
                                ?? string.Empty,

                            Status =
                                po.Status.ToString(),

                            OrderDate =
                                po.OrderDate,

                            ReceivedDate =
                                po.ReceivedDate,

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
                );

            return Ok(result);
        }

        // =====================================================
        // STOCK MOVEMENT REPORT
        // =====================================================

        [HttpGet("stock-movements")]
        public async Task<IActionResult> GetStockMovementReport(
            [FromQuery] string? type = null)
        {
            var query =
                _context.StockMovements
                    .AsNoTracking()
                    .Include(
                        m =>
                            m.Product
                    )
                    .Include(
                        m =>
                            m.Warehouse
                    )
                    .AsQueryable();

            if (
                !string.IsNullOrWhiteSpace(
                    type
                ) &&
                Enum.TryParse<StockMovementType>(
                    type,
                    true,
                    out var parsedType
                )
            )
            {
                query =
                    query.Where(
                        m =>
                            m.Type ==
                            parsedType
                    );
            }

            var result =
                await query
                    .OrderByDescending(
                        m =>
                            m.Timestamp
                    )
                    .Take(500)
                    .Select(
                        m =>
                            new StockMovementReportDto
                            {
                                Id =
                                    m.Id,

                                ProductName =
                                    m.Product.Name,

                                WarehouseName =
                                    m.Warehouse.Name,

                                Type =
                                    m.Type.ToString(),

                                QuantityChange =
                                    m.Quantity,

                                QuantityAfter =
                                    m.QuantityAfter,

                                Reason =
                                    m.Reason,

                                PerformedBy =
                                    m.PerformedBy,

                                PerformedByRole =
                                    m.PerformedByRole,

                                Timestamp =
                                    m.Timestamp
                            }
                    )
                    .ToListAsync();

            return Ok(result);
        }

        // =====================================================
        // LOW STOCK REPORT
        // =====================================================

        [HttpGet("low-stock")]
        public async Task<IActionResult> GetLowStockReport(
            [FromQuery] int threshold = DefaultLowStockThreshold)
        {
            if (threshold < 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Threshold cannot be negative."
                    }
                );
            }

            var products =
                await _context.Products
                    .AsNoTracking()
                    .OrderBy(
                        p => p.Name
                    )
                    .ToListAsync();

            var result =
                new List<LowStockReportDto>();

            foreach (
                var product in products
            )
            {
                var totalStock =
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
                    totalStock <=
                    threshold
                )
                {
                    result.Add(
                        new LowStockReportDto
                        {
                            ProductId =
                                product.Id,

                            ProductName =
                                product.Name,

                            Category =
                                product.Category,

                            Price =
                                product.Price,

                            TotalStock =
                                totalStock,

                            Threshold =
                                threshold
                        }
                    );
                }
            }

            return Ok(
                result
            );
        }

        // =====================================================
        // USER ACTIVITY REPORT
        // =====================================================

        [HttpGet("user-activity")]
        public async Task<IActionResult> GetUserActivityReport(
            [FromQuery] string? user = null,
            [FromQuery] string? entityType = null)
        {
            var query =
                _context.ActivityLogs
                    .AsNoTracking()
                    .AsQueryable();

            if (
                !string.IsNullOrWhiteSpace(
                    user
                )
            )
            {
                query =
                    query.Where(
                        log =>
                            log.PerformedBy ==
                            user
                    );
            }

            if (
                !string.IsNullOrWhiteSpace(
                    entityType
                )
            )
            {
                query =
                    query.Where(
                        log =>
                            log.EntityType ==
                            entityType
                    );
            }

            var result =
                await query
                    .OrderByDescending(
                        log =>
                            log.Timestamp
                    )
                    .Take(500)
                    .Select(
                        log =>
                            new UserActivityReportDto
                            {
                                Id =
                                    log.Id,

                                EntityType =
                                    log.EntityType,

                                TargetName =
                                    log.TargetName,

                                Action =
                                    log.Action,

                                PerformedBy =
                                    log.PerformedBy,

                                PerformedByRole =
                                    log.PerformedByRole,

                                Timestamp =
                                    log.Timestamp
                            }
                    )
                    .ToListAsync();

            return Ok(result);
        }
    }
}