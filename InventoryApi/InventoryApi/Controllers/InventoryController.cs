using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.DTOs;
using InventoryApi.Models;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InventoryController(
            AppDbContext context)
        {
            _context = context;
        }

        private async Task<Product?> GetProduct(
            int productId)
        {
            return await _context.Products
                .FirstOrDefaultAsync(
                    p =>
                        p.Id == productId &&
                        p.IsActive
                );
        }

        private async Task<Warehouse?> GetWarehouse(
            int warehouseId)
        {
            return await _context.Warehouses
                .FirstOrDefaultAsync(
                    w => w.Id == warehouseId
                );
        }

        private async Task<ProductStock> GetOrCreateStockRow(
            int productId,
            int warehouseId)
        {
            var stock =
                await _context.ProductStocks
                    .FirstOrDefaultAsync(
                        ps =>
                            ps.ProductId == productId &&
                            ps.WarehouseId == warehouseId
                    );

            if (stock == null)
            {
                stock = new ProductStock
                {
                    ProductId = productId,
                    WarehouseId = warehouseId,
                    Quantity = 0
                };

                _context.ProductStocks.Add(stock);
            }

            return stock;
        }

        private void AddMovement(
            int productId,
            int warehouseId,
            StockMovementType type,
            int quantityChange,
            int quantityAfter,
            string reason,
            string userName,
            string userRole)
        {
            _context.StockMovements.Add(
                new StockMovement
                {
                    ProductId = productId,
                    WarehouseId = warehouseId,
                    Type = type,
                    Quantity = quantityChange,
                    QuantityAfter = quantityAfter,
                    Reason =
                        string.IsNullOrWhiteSpace(reason)
                            ? "-"
                            : reason.Trim(),
                    PerformedBy =
                        string.IsNullOrWhiteSpace(userName)
                            ? "Unknown"
                            : userName,
                    PerformedByRole =
                        string.IsNullOrWhiteSpace(userRole)
                            ? "User"
                            : userRole,
                    Timestamp = DateTime.Now
                }
            );
        }

        [HttpPost("stock-in")]
        public async Task<IActionResult> StockIn(
            StockInDto dto,
            [FromHeader(Name = "X-User-Name")]
            string userName,
            [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            if (dto.Quantity <= 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Quantity must be greater than zero."
                    }
                );
            }

            var product =
                await GetProduct(dto.ProductId);

            if (product == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Product not found or inactive."
                    }
                );
            }

            var warehouse =
                await GetWarehouse(dto.WarehouseId);

            if (warehouse == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Warehouse not found."
                    }
                );
            }

            var stock =
                await GetOrCreateStockRow(
                    dto.ProductId,
                    dto.WarehouseId
                );

            stock.Quantity += dto.Quantity;

            AddMovement(
                product.Id,
                warehouse.Id,
                StockMovementType.In,
                dto.Quantity,
                stock.Quantity,
                dto.Reason,
                userName,
                userRole
            );

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        $"Added {dto.Quantity} x {product.Name} to {warehouse.Name}.",
                    quantity = stock.Quantity
                }
            );
        }

        [HttpPost("stock-out")]
        public async Task<IActionResult> StockOut(
            StockOutDto dto,
            [FromHeader(Name = "X-User-Name")]
            string userName,
            [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            if (dto.Quantity <= 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Quantity must be greater than zero."
                    }
                );
            }

            var product =
                await GetProduct(dto.ProductId);

            if (product == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Product not found or inactive."
                    }
                );
            }

            var warehouse =
                await GetWarehouse(dto.WarehouseId);

            if (warehouse == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Warehouse not found."
                    }
                );
            }

            var stock =
                await GetOrCreateStockRow(
                    dto.ProductId,
                    dto.WarehouseId
                );

            if (stock.Quantity < dto.Quantity)
            {
                return BadRequest(
                    new
                    {
                        message =
                            $"Not enough stock. Only {stock.Quantity} available in {warehouse.Name}."
                    }
                );
            }

            stock.Quantity -= dto.Quantity;

            AddMovement(
                product.Id,
                warehouse.Id,
                StockMovementType.Out,
                -dto.Quantity,
                stock.Quantity,
                dto.Reason,
                userName,
                userRole
            );

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        $"Removed {dto.Quantity} x {product.Name} from {warehouse.Name}.",
                    quantity = stock.Quantity
                }
            );
        }

        [HttpPost("adjust")]
        public async Task<IActionResult> Adjust(
            StockAdjustDto dto,
            [FromHeader(Name = "X-User-Name")]
            string userName,
            [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            if (dto.NewQuantity < 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Quantity cannot be negative."
                    }
                );
            }

            if (string.IsNullOrWhiteSpace(dto.Reason))
            {
                return BadRequest(
                    new
                    {
                        message =
                            "A reason is required for stock adjustments."
                    }
                );
            }

            var product =
                await GetProduct(dto.ProductId);

            if (product == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Product not found or inactive."
                    }
                );
            }

            var warehouse =
                await GetWarehouse(dto.WarehouseId);

            if (warehouse == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Warehouse not found."
                    }
                );
            }

            var stock =
                await GetOrCreateStockRow(
                    dto.ProductId,
                    dto.WarehouseId
                );

            int change =
                dto.NewQuantity -
                stock.Quantity;

            stock.Quantity =
                dto.NewQuantity;

            AddMovement(
                product.Id,
                warehouse.Id,
                StockMovementType.Adjustment,
                change,
                stock.Quantity,
                dto.Reason,
                userName,
                userRole
            );

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        $"Adjusted {product.Name} at {warehouse.Name} to {stock.Quantity}.",
                    quantity = stock.Quantity
                }
            );
        }

        [HttpPost("transfer")]
        public async Task<IActionResult> Transfer(
            StockTransferDto dto,
            [FromHeader(Name = "X-User-Name")]
            string userName,
            [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            if (dto.Quantity <= 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Quantity must be greater than zero."
                    }
                );
            }

            if (
                dto.FromWarehouseId ==
                dto.ToWarehouseId
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Source and destination warehouses must be different."
                    }
                );
            }

            var product =
                await GetProduct(dto.ProductId);

            if (product == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Product not found or inactive."
                    }
                );
            }

            var fromWarehouse =
                await GetWarehouse(
                    dto.FromWarehouseId
                );

            var toWarehouse =
                await GetWarehouse(
                    dto.ToWarehouseId
                );

            if (fromWarehouse == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Source warehouse not found."
                    }
                );
            }

            if (toWarehouse == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Destination warehouse not found."
                    }
                );
            }

            var fromStock =
                await GetOrCreateStockRow(
                    product.Id,
                    fromWarehouse.Id
                );

            if (fromStock.Quantity < dto.Quantity)
            {
                return BadRequest(
                    new
                    {
                        message =
                            $"Not enough stock. Only {fromStock.Quantity} available in {fromWarehouse.Name}."
                    }
                );
            }

            var toStock =
                await GetOrCreateStockRow(
                    product.Id,
                    toWarehouse.Id
                );

            fromStock.Quantity -=
                dto.Quantity;

            toStock.Quantity +=
                dto.Quantity;

            string reason =
                string.IsNullOrWhiteSpace(dto.Reason)
                    ? $"Transfer to {toWarehouse.Name}"
                    : dto.Reason.Trim();

            AddMovement(
                product.Id,
                fromWarehouse.Id,
                StockMovementType.Transfer,
                -dto.Quantity,
                fromStock.Quantity,
                $"{reason} (to {toWarehouse.Name})",
                userName,
                userRole
            );

            AddMovement(
                product.Id,
                toWarehouse.Id,
                StockMovementType.Transfer,
                dto.Quantity,
                toStock.Quantity,
                $"{reason} (from {fromWarehouse.Name})",
                userName,
                userRole
            );

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        $"Transferred {dto.Quantity} x {product.Name} from {fromWarehouse.Name} to {toWarehouse.Name}.",

                    fromQuantity =
                        fromStock.Quantity,

                    toQuantity =
                        toStock.Quantity
                }
            );
        }

        [HttpGet("stock")]
        public async Task<IActionResult> GetStock(
            [FromQuery] int? productId,
            [FromQuery] int? warehouseId)
        {
            var query =
                _context.ProductStocks
                    .AsNoTracking()
                    .Include(ps => ps.Product)
                    .Include(ps => ps.Warehouse)
                    .AsQueryable();

            if (productId.HasValue)
            {
                query = query.Where(
                    ps =>
                        ps.ProductId ==
                        productId.Value
                );
            }

            if (warehouseId.HasValue)
            {
                query = query.Where(
                    ps =>
                        ps.WarehouseId ==
                        warehouseId.Value
                );
            }

            var result =
                await query
                    .OrderBy(
                        ps => ps.Product.Name
                    )
                    .Select(
                        ps =>
                            new ProductStockDto
                            {
                                ProductId =
                                    ps.ProductId,

                                ProductName =
                                    ps.Product.Name,

                                SKU =
                                    ps.Product.SKU
                                    ?? string.Empty,

                                WarehouseId =
                                    ps.WarehouseId,

                                WarehouseName =
                                    ps.Warehouse.Name,

                                Quantity =
                                    ps.Quantity
                            }
                    )
                    .ToListAsync();

            return Ok(result);
        }

        [HttpGet("stock/totals")]
        public async Task<IActionResult> GetStockTotals()
        {
            var products =
                await _context.Products
                    .AsNoTracking()
                    .Where(p => p.IsActive)
                    .Select(
                        p =>
                            new
                            {
                                p.Id,
                                p.Name,
                                p.SKU,
                                p.Category,
                                p.Price,
                                p.MinimumStockLevel,
                                Brand =
                                    p.Brand != null
                                        ? p.Brand.Name
                                        : string.Empty,
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
                    .OrderBy(p => p.Name)
                    .ToListAsync();

            var result =
                products
                    .Select(
                        p =>
                            new ProductTotalStockDto
                            {
                                ProductId =
                                    p.Id,

                                ProductName =
                                    p.Name,

                                SKU =
                                    p.SKU
                                    ?? string.Empty,

                                Category =
                                    p.Category,

                                Brand =
                                    p.Brand,

                                Price =
                                    p.Price,

                                MinimumStockLevel =
                                    p.MinimumStockLevel,

                                TotalStock =
                                    p.TotalStock,

                                IsOutOfStock =
                                    p.TotalStock == 0,

                                IsLowStock =
                                    p.TotalStock <=
                                    p.MinimumStockLevel
                            }
                    )
                    .ToList();

            return Ok(result);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory(
            [FromQuery] int? productId,
            [FromQuery] int? warehouseId,
            [FromQuery] int take = 100)
        {
            take =
                Math.Clamp(
                    take,
                    1,
                    500
                );

            var query =
                _context.StockMovements
                    .AsNoTracking()
                    .Include(m => m.Product)
                    .Include(m => m.Warehouse)
                    .AsQueryable();

            if (productId.HasValue)
            {
                query = query.Where(
                    m =>
                        m.ProductId ==
                        productId.Value
                );
            }

            if (warehouseId.HasValue)
            {
                query = query.Where(
                    m =>
                        m.WarehouseId ==
                        warehouseId.Value
                );
            }

            var result =
                await query
                    .OrderByDescending(
                        m => m.Timestamp
                    )
                    .Take(take)
                    .Select(
                        m =>
                            new StockMovementDto
                            {
                                Id = m.Id,

                                ProductId =
                                    m.ProductId,

                                ProductName =
                                    m.Product.Name,

                                SKU =
                                    m.Product.SKU
                                    ?? string.Empty,

                                WarehouseId =
                                    m.WarehouseId,

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

        [HttpGet("low-stock")]
        public async Task<IActionResult> GetLowStock(
            [FromQuery] int? threshold = null)
        {
            var products =
                await _context.Products
                    .AsNoTracking()
                    .Where(p => p.IsActive)
                    .Select(
                        p =>
                            new
                            {
                                p.Id,
                                p.Name,
                                p.SKU,
                                p.Category,
                                p.Price,
                                p.MinimumStockLevel,
                                Brand =
                                    p.Brand != null
                                        ? p.Brand.Name
                                        : string.Empty,
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
                    .OrderBy(p => p.Name)
                    .ToListAsync();

            var result =
                products
                    .Where(
                        p =>
                            threshold.HasValue
                                ? p.TotalStock <=
                                  threshold.Value
                                : p.TotalStock <=
                                  p.MinimumStockLevel
                    )
                    .Select(
                        p =>
                            new ProductTotalStockDto
                            {
                                ProductId =
                                    p.Id,

                                ProductName =
                                    p.Name,

                                SKU =
                                    p.SKU
                                    ?? string.Empty,

                                Category =
                                    p.Category,

                                Brand =
                                    p.Brand,

                                Price =
                                    p.Price,

                                MinimumStockLevel =
                                    p.MinimumStockLevel,

                                TotalStock =
                                    p.TotalStock,

                                IsOutOfStock =
                                    p.TotalStock == 0,

                                IsLowStock =
                                    p.TotalStock <=
                                    (
                                        threshold
                                            ?? p.MinimumStockLevel
                                    )
                            }
                    )
                    .OrderBy(
                        p => p.TotalStock
                    )
                    .ToList();

            return Ok(result);
        }
    }
}