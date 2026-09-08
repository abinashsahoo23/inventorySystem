using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.DTOs;
using InventoryApi.Models;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/purchase")]
    public class PurchaseController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders(
            [FromQuery] string? status = null)
        {
            var query = _context.PurchaseOrders
                .AsNoTracking()
                .Include(po => po.Supplier)
                .Include(po => po.Warehouse)
                .Include(po => po.Items)
                    .ThenInclude(i => i.Product)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(
                    po => po.Status.ToString() == status
                );
            }

            var orders = await query
                .OrderByDescending(po => po.OrderDate)
                .ToListAsync();

            return Ok(
                orders.Select(BuildDto).ToList()
            );
        }

        [HttpGet("orders/{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var order = await _context.PurchaseOrders
                .AsNoTracking()
                .Include(po => po.Supplier)
                .Include(po => po.Warehouse)
                .Include(po => po.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null)
            {
                return NotFound(new
                {
                    message = "Purchase order not found."
                });
            }

            return Ok(BuildDto(order));
        }

        [HttpPost("orders")]
        public async Task<IActionResult> CreateOrder(
            CreatePurchaseOrderDto dto,
            [FromHeader(Name = "X-User-Name")] string userName,
            [FromHeader(Name = "X-User-Role")] string userRole)
        {
            if (dto.SupplierId <= 0)
            {
                return BadRequest(new
                {
                    message = "Supplier is required."
                });
            }

            if (dto.WarehouseId <= 0)
            {
                return BadRequest(new
                {
                    message = "Warehouse is required."
                });
            }

            if (dto.Items == null || dto.Items.Count == 0)
            {
                return BadRequest(new
                {
                    message =
                        "At least one purchase item is required."
                });
            }

            var supplier = await _context.Suppliers
                .FirstOrDefaultAsync(
                    s =>
                        s.Id == dto.SupplierId &&
                        s.IsActive
                );

            if (supplier == null)
            {
                return BadRequest(new
                {
                    message =
                        "Selected supplier is not available."
                });
            }

            var warehouse = await _context.Warehouses
                .FirstOrDefaultAsync(
                    w =>
                        w.Id == dto.WarehouseId &&
                        w.IsActive
                );

            if (warehouse == null)
            {
                return BadRequest(new
                {
                    message =
                        "Selected warehouse is not available."
                });
            }

            var productIds = dto.Items
                .Select(i => i.ProductId)
                .Distinct()
                .ToList();

            var products = await _context.Products
                .Where(
                    p =>
                        productIds.Contains(p.Id) &&
                        p.IsActive
                )
                .ToListAsync();

            if (products.Count != productIds.Count)
            {
                return BadRequest(new
                {
                    message =
                        "One or more selected products are invalid or inactive."
                });
            }

            foreach (var item in dto.Items)
            {
                if (item.Quantity <= 0)
                {
                    return BadRequest(new
                    {
                        message =
                            "Purchase quantity must be greater than zero."
                    });
                }

                if (item.UnitPrice < 0)
                {
                    return BadRequest(new
                    {
                        message =
                            "Purchase price cannot be negative."
                    });
                }
            }

            var order = new PurchaseOrder
            {
                SupplierId = dto.SupplierId,

                WarehouseId = dto.WarehouseId,

                Status =
                    PurchaseOrderStatus.Pending,

                OrderDate = DateTime.Now,

                CreatedBy =
                    string.IsNullOrWhiteSpace(userName)
                        ? "Unknown"
                        : userName,

                CreatedByRole =
                    string.IsNullOrWhiteSpace(userRole)
                        ? "User"
                        : userRole
            };

            foreach (var item in dto.Items)
            {
                order.Items.Add(
                    new PurchaseOrderItem
                    {
                        ProductId =
                            item.ProductId,

                        Quantity =
                            item.Quantity,

                        UnitPrice =
                            item.UnitPrice
                    }
                );
            }

            _context.PurchaseOrders.Add(order);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetOrder),
                new
                {
                    id = order.Id
                },
                await LoadOrder(order.Id)
            );
        }

        [HttpPost("orders/{id}/receive")]
        public async Task<IActionResult> ReceiveOrder(
            int id,
            [FromHeader(Name = "X-User-Name")]
            string userName,
            [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            var order = await _context.PurchaseOrders
                .Include(po => po.Items)
                .FirstOrDefaultAsync(
                    po => po.Id == id
                );

            if (order == null)
            {
                return NotFound(new
                {
                    message =
                        "Purchase order not found."
                });
            }

            if (
                order.Status !=
                PurchaseOrderStatus.Pending
            )
            {
                return BadRequest(new
                {
                    message =
                        $"Order cannot be received because its status is {order.Status}."
                });
            }

            foreach (var item in order.Items)
            {
                var stock =
                    await _context.ProductStocks
                        .FirstOrDefaultAsync(
                            ps =>
                                ps.ProductId ==
                                item.ProductId &&
                                ps.WarehouseId ==
                                order.WarehouseId
                        );

                if (stock == null)
                {
                    stock = new ProductStock
                    {
                        ProductId =
                            item.ProductId,

                        WarehouseId =
                            order.WarehouseId,

                        Quantity = 0
                    };

                    _context.ProductStocks.Add(stock);
                }

                stock.Quantity += item.Quantity;

                _context.StockMovements.Add(
                    new StockMovement
                    {
                        ProductId =
                            item.ProductId,

                        WarehouseId =
                            order.WarehouseId,

                        Type =
                            StockMovementType.In,

                        Quantity =
                            item.Quantity,

                        QuantityAfter =
                            stock.Quantity,

                        Reason =
                            $"Purchase Order #{order.Id}",

                        PerformedBy =
                            string.IsNullOrWhiteSpace(
                                userName
                            )
                                ? "Unknown"
                                : userName,

                        PerformedByRole =
                            string.IsNullOrWhiteSpace(
                                userRole
                            )
                                ? "User"
                                : userRole,

                        Timestamp =
                            DateTime.Now
                    }
                );
            }

            order.Status =
                PurchaseOrderStatus.Received;

            order.ReceivedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    $"Purchase order #{id} received and stock updated."
            });
        }

        [HttpPost("orders/{id}/cancel")]
        public async Task<IActionResult> CancelOrder(
            int id)
        {
            var order =
                await _context.PurchaseOrders
                    .FirstOrDefaultAsync(
                        po => po.Id == id
                    );

            if (order == null)
            {
                return NotFound(new
                {
                    message =
                        "Purchase order not found."
                });
            }

            if (
                order.Status !=
                PurchaseOrderStatus.Pending
            )
            {
                return BadRequest(new
                {
                    message =
                        "Only pending purchase orders can be cancelled."
                });
            }

            order.Status =
                PurchaseOrderStatus.Cancelled;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    $"Purchase order #{id} cancelled."
            });
        }

        private static PurchaseOrderDto BuildDto(
            PurchaseOrder order)
        {
            return new PurchaseOrderDto
            {
                Id = order.Id,

                SupplierId =
                    order.SupplierId,

                SupplierName =
                    order.Supplier?.Name
                    ?? string.Empty,

                WarehouseId =
                    order.WarehouseId,

                WarehouseName =
                    order.Warehouse?.Name
                    ?? string.Empty,

                Status =
                    order.Status.ToString(),

                OrderDate =
                    order.OrderDate,

                ReceivedDate =
                    order.ReceivedDate,

                CreatedBy =
                    order.CreatedBy,

                CreatedByRole =
                    order.CreatedByRole,

                TotalAmount =
                    order.Items.Sum(
                        i =>
                            i.Quantity *
                            i.UnitPrice
                    ),

                ItemCount =
                    order.Items.Count,

                Items =
                    order.Items
                        .Select(
                            i =>
                                new PurchaseOrderItemDto
                                {
                                    Id =
                                        i.Id,

                                    ProductId =
                                        i.ProductId,

                                    ProductName =
                                        i.Product?.Name
                                        ?? string.Empty,

                                    SKU =
                                        i.Product?.SKU
                                        ?? string.Empty,

                                    Quantity =
                                        i.Quantity,

                                    UnitPrice =
                                        i.UnitPrice,

                                    Total =
                                        i.Quantity *
                                        i.UnitPrice
                                }
                        )
                        .ToList()
            };
        }

        private async Task<PurchaseOrderDto?> LoadOrder(
            int id)
        {
            var order =
                await _context.PurchaseOrders
                    .AsNoTracking()
                    .Include(po => po.Supplier)
                    .Include(po => po.Warehouse)
                    .Include(po => po.Items)
                        .ThenInclude(i => i.Product)
                    .FirstOrDefaultAsync(
                        po => po.Id == id
                    );

            return order == null
                ? null
                : BuildDto(order);
        }
    }
}