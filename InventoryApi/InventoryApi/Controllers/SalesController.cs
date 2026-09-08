using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.DTOs;
using InventoryApi.Models;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/sales")]
    public class SalesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SalesController(AppDbContext context)
        {
            _context = context;
        }

        private IQueryable<SalesOrder> FullOrderQuery()
        {
            return _context.SalesOrders
                .AsNoTracking()
                .Include(so => so.Customer)
                .Include(so => so.Warehouse)
                .Include(so => so.Items)
                    .ThenInclude(i => i.Product);
        }

        private static SalesOrderDto ToDto(
            SalesOrder order)
        {
            return new SalesOrderDto
            {
                Id = order.Id,

                CustomerId =
                    order.CustomerId,

                CustomerName =
                    order.Customer?.Name
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

                CompletedDate =
                    order.CompletedDate,

                InvoiceNumber =
                    order.InvoiceNumber,

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
                                new SalesOrderItemDto
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
                                        i.UnitPrice
                                }
                        )
                        .ToList()
            };
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders(
            [FromQuery] string? status = null)
        {
            var query =
                FullOrderQuery();

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

            return Ok(
                orders.Select(
                    ToDto
                )
            );
        }

        [HttpGet("orders/{id}")]
        public async Task<IActionResult> GetOrder(
            int id)
        {
            var order =
                await FullOrderQuery()
                    .FirstOrDefaultAsync(
                        so =>
                            so.Id == id
                    );

            if (order == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Sales order not found."
                    }
                );
            }

            return Ok(
                ToDto(order)
            );
        }

        [HttpGet(
            "orders/{id}/invoice"
        )]
        public async Task<IActionResult> GetInvoice(
            int id)
        {
            var order =
                await _context.SalesOrders
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
                    .ThenInclude(
                        i =>
                            i.Product
                    )
                    .FirstOrDefaultAsync(
                        so =>
                            so.Id == id
                    );

            if (order == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Sales order not found."
                    }
                );
            }

            if (
                order.Status !=
                SalesOrderStatus.Completed
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Invoice is available only for completed sales orders."
                    }
                );
            }

            var invoice =
                new InvoiceDto
                {
                    SalesOrderId =
                        order.Id,

                    InvoiceNumber =
                        order.InvoiceNumber
                        ?? $"INV-{order.Id:D5}",

                    InvoiceDate =
                        order.CompletedDate
                        ?? order.OrderDate,

                    CustomerName =
                        order.Customer.Name,

                    CustomerPhone =
                        order.Customer.Phone,

                    CustomerEmail =
                        order.Customer.Email,

                    CustomerAddress =
                        order.Customer.Address,

                    WarehouseName =
                        order.Warehouse.Name,

                    CreatedBy =
                        order.CreatedBy,

                    TotalAmount =
                        order.Items.Sum(
                            i =>
                                i.Quantity *
                                i.UnitPrice
                        ),

                    Items =
                        order.Items
                            .Select(
                                i =>
                                    new SalesOrderItemDto
                                    {
                                        Id =
                                            i.Id,

                                        ProductId =
                                            i.ProductId,

                                        ProductName =
                                            i.Product.Name,

                                        SKU =
                                            i.Product.SKU
                                            ?? string.Empty,

                                        Quantity =
                                            i.Quantity,

                                        UnitPrice =
                                            i.UnitPrice
                                    }
                            )
                            .ToList()
                };

            return Ok(invoice);
        }

        [HttpPost("orders")]
        public async Task<IActionResult> Create(
            CreateSalesOrderDto dto,
            [FromHeader(Name = "X-User-Name")]
            string userName,
            [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            if (
                dto.Items == null ||
                dto.Items.Count == 0
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "A sales order needs at least one item."
                    }
                );
            }

            var customer =
                await _context.Customers
                    .FirstOrDefaultAsync(
                        c =>
                            c.Id ==
                            dto.CustomerId
                    );

            if (customer == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Customer not found."
                    }
                );
            }

            var warehouse =
                await _context.Warehouses
                    .FirstOrDefaultAsync(
                        w =>
                            w.Id ==
                            dto.WarehouseId &&
                            w.IsActive
                    );

            if (warehouse == null)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Selected warehouse is not available."
                    }
                );
            }

            var productIds =
                dto.Items
                    .Select(
                        i =>
                            i.ProductId
                    )
                    .Distinct()
                    .ToList();

            var products =
                await _context.Products
                    .Where(
                        p =>
                            productIds.Contains(
                                p.Id
                            ) &&
                            p.IsActive
                    )
                    .ToListAsync();

            if (
                products.Count !=
                productIds.Count
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "One or more selected products are invalid or inactive."
                    }
                );
            }

            var productMap =
                products.ToDictionary(
                    p => p.Id
                );

            var stockByProduct =
                await _context.ProductStocks
                    .AsNoTracking()
                    .Where(
                        ps =>
                            ps.WarehouseId == warehouse.Id &&
                            productIds.Contains(ps.ProductId)
                    )
                    .ToDictionaryAsync(
                        ps => ps.ProductId,
                        ps => ps.Quantity
                    );

            var requestedByProduct =
                new Dictionary<int, int>();

            foreach (var item in dto.Items)
            {
                if (item.Quantity <= 0)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Every item quantity must be greater than zero."
                        }
                    );
                }

                if (item.UnitPrice < 0)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Unit price cannot be negative."
                        }
                    );

                }

                if (
                    !productMap.ContainsKey(
                        item.ProductId
                    )
                )
                {
                    return BadRequest(
                        new
                        {
                            message =
                                $"Product {item.ProductId} is not available."
                        }
                    );
                }

                requestedByProduct[item.ProductId] =
                    requestedByProduct.GetValueOrDefault(
                        item.ProductId
                    ) + item.Quantity;

                var available =
                    stockByProduct.GetValueOrDefault(
                        item.ProductId
                    );

                if (available <= 0)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                $"{productMap[item.ProductId].Name} has no stock in {warehouse.Name}."
                        }
                    );
                }

                if (requestedByProduct[item.ProductId] > available)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                $"Not enough stock of {productMap[item.ProductId].Name} in {warehouse.Name}. Available: {available}, requested: {requestedByProduct[item.ProductId]}."
                        }
                    );
                }
            }

            var order =
                new SalesOrder
                {
                    CustomerId =
                        customer.Id,

                    WarehouseId =
                        warehouse.Id,

                    Status =
                        SalesOrderStatus.Pending,

                    OrderDate =
                        DateTime.Now,

                    CreatedBy =
                        string.IsNullOrWhiteSpace(
                            userName
                        )
                            ? "Unknown"
                            : userName,

                    CreatedByRole =
                        string.IsNullOrWhiteSpace(
                            userRole
                        )
                            ? "User"
                            : userRole,

                    Items =
                        dto.Items
                            .Select(
                                item =>
                                {
                                    var product =
                                        productMap[
                                            item.ProductId
                                        ];

                                    var price =
                                        item.UnitPrice >
                                        0
                                            ? item.UnitPrice
                                            : product.Price;

                                    return new SalesOrderItem
                                    {
                                        ProductId =
                                            item.ProductId,

                                        Quantity =
                                            item.Quantity,

                                        UnitPrice =
                                            price
                                    };
                                }
                            )
                            .ToList()
                };

            _context.SalesOrders.Add(
                order
            );

            await _context.SaveChangesAsync();

            var saved =
                await FullOrderQuery()
                    .FirstAsync(
                        so =>
                            so.Id ==
                            order.Id
                    );

            return CreatedAtAction(
                nameof(GetOrder),
                new
                {
                    id = order.Id
                },
                ToDto(saved)
            );
        }

        [HttpPost(
            "orders/{id}/complete"
        )]
        public async Task<IActionResult> Complete(
            int id,
            [FromHeader(Name = "X-User-Name")]
            string userName,
            [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            var order =
                await _context.SalesOrders
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
                    .ThenInclude(
                        i =>
                            i.Product
                    )
                    .FirstOrDefaultAsync(
                        so =>
                            so.Id == id
                    );

            if (order == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Sales order not found."
                    }
                );
            }

            if (
                order.Status !=
                SalesOrderStatus.Pending
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            $"Only pending orders can be completed. This order is {order.Status}."
                    }
                );
            }

            var stockRows =
                new Dictionary<
                    int,
                    ProductStock
                >();

            foreach (
                var item in order.Items
            )
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

                var available =
                    stock?.Quantity ?? 0;

                if (
                    available <
                    item.Quantity
                )
                {
                    return BadRequest(
                        new
                        {
                            message =
                                $"Not enough stock of {item.Product.Name} in {order.Warehouse.Name}. Available: {available}, needed: {item.Quantity}."
                        }
                    );
                }

                if (stock == null)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                $"No stock record exists for {item.Product.Name}."
                        }
                    );
                }

                stockRows[
                    item.ProductId
                ] = stock;
            }

            foreach (
                var item in order.Items
            )
            {
                var stock =
                    stockRows[
                        item.ProductId
                    ];

                stock.Quantity -=
                    item.Quantity;

                _context.StockMovements.Add(
                    new StockMovement
                    {
                        ProductId =
                            item.ProductId,

                        WarehouseId =
                            order.WarehouseId,

                        Type =
                            StockMovementType.Out,

                        Quantity =
                            -item.Quantity,

                        QuantityAfter =
                            stock.Quantity,

                        Reason =
                            $"Sales order #{order.Id} sold to {order.Customer.Name}",

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
                SalesOrderStatus.Completed;

            order.CompletedDate =
                DateTime.Now;

            order.InvoiceNumber =
                $"INV-{order.Id:D5}";

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        $"Sales order #{order.Id} completed. Invoice {order.InvoiceNumber} generated.",

                    order =
                        ToDto(order)
                }
            );
        }

        [HttpPost(
            "orders/{id}/cancel"
        )]
        public async Task<IActionResult> Cancel(
            int id)
        {
            var order =
                await _context.SalesOrders
                    .FirstOrDefaultAsync(
                        so =>
                            so.Id == id
                    );

            if (order == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Sales order not found."
                    }
                );
            }

            if (
                order.Status !=
                SalesOrderStatus.Pending
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            $"Only pending orders can be cancelled. This order is {order.Status}."
                    }
                );
            }

            order.Status =
                SalesOrderStatus.Cancelled;

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message =
                        $"Sales order #{order.Id} cancelled."
                }
            );
        }
    }
}