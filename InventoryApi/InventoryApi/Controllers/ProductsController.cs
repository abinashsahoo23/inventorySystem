using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.DTOs;
using InventoryApi.Models;
using ClosedXML.Excel;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductsController(AppDbContext context)
        {
            _context = context;
        }

        private async Task LogActivity(
            string targetName,
            string action,
            string userName,
            string userRole)
        {
            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    EntityType = "Product",
                    TargetName = targetName,
                    Action = action,
                    PerformedBy =
                        string.IsNullOrWhiteSpace(userName)
                            ? "Unknown"
                            : userName,
                    PerformedByRole =
                        string.IsNullOrWhiteSpace(userRole)
                            ? "User"
                            : userRole
                }
            );

            await _context.SaveChangesAsync();
        }

        private async Task<ProductResponseDto> ToResponseDto(
            Product product)
        {
            var totalStock =
                await _context.ProductStocks
                    .Where(
                        ps => ps.ProductId == product.Id
                    )
                    .SumAsync(
                        ps => (int?)ps.Quantity
                    ) ?? 0;

            var categoryName =
                product.CategoryId.HasValue
                    ? await _context.Categories
                        .Where(
                            c =>
                                c.Id ==
                                product.CategoryId.Value
                        )
                        .Select(c => c.Name)
                        .FirstOrDefaultAsync()
                    : null;

            var brandName =
                product.BrandId.HasValue
                    ? await _context.Brands
                        .Where(
                            b =>
                                b.Id ==
                                product.BrandId.Value
                        )
                        .Select(b => b.Name)
                        .FirstOrDefaultAsync()
                    : null;

            return new ProductResponseDto
            {
                Id = product.Id,
                Name = product.Name,
                SKU = product.SKU ?? string.Empty,
                Description = product.Description,

                CategoryId = product.CategoryId,
                Category =
                    categoryName
                    ?? product.Category
                    ?? string.Empty,

                BrandId = product.BrandId,
                Brand = brandName ?? string.Empty,

                PurchasePrice = product.PurchasePrice,

                SellingPrice = product.Price,
                Price = product.Price,

                MinimumStockLevel =
                    product.MinimumStockLevel,

                IsActive = product.IsActive,

                CreatedAt = product.CreatedAt,
                TotalStock = totalStock
            };
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? brandId = null,
            [FromQuery] bool activeOnly = false)
        {
            var query =
                _context.Products
                    .AsNoTracking()
                    .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var value =
                    search.Trim().ToLower();

                query = query.Where(
                    p =>
                        p.Name
                            .ToLower()
                            .Contains(value) ||
                        (p.SKU != null &&
                         p.SKU
                            .ToLower()
                            .Contains(value)) ||
                        p.Category
                            .ToLower()
                            .Contains(value)
                );
            }

            if (categoryId.HasValue)
            {
                query = query.Where(
                    p =>
                        p.CategoryId ==
                        categoryId.Value
                );
            }

            if (brandId.HasValue)
            {
                query = query.Where(
                    p =>
                        p.BrandId ==
                        brandId.Value
                );
            }

            if (activeOnly)
            {
                query = query.Where(
                    p => p.IsActive
                );
            }

            var products =
                await query
                    .OrderBy(p => p.Name)
                    .ToListAsync();

            var result =
                new List<ProductResponseDto>();

            foreach (var product in products)
            {
                result.Add(
                    await ToResponseDto(product)
                );
            }

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOne(int id)
        {
            var product =
                await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Product not found."
                    }
                );
            }

            return Ok(
                await ToResponseDto(product)
            );
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            CreateProductDto dto,
            [FromHeader(Name = "X-User-Name")]
            string userName,
            [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Product name is required."
                    }
                );
            }

            if (dto.PurchasePrice < 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Purchase price cannot be negative."
                    }
                );
            }

            if (dto.SellingPrice < 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Selling price cannot be negative."
                    }
                );
            }

            if (dto.MinimumStockLevel < 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Minimum stock level cannot be negative."
                    }
                );
            }

            if (
                dto.PurchasePrice >
                dto.SellingPrice
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Selling price should not be lower than purchase price."
                    }
                );
            }

            int? categoryId = dto.CategoryId;

            string categoryName =
                string.Empty;

            if (categoryId.HasValue)
            {
                var category =
                    await _context.Categories
                        .FirstOrDefaultAsync(
                            c =>
                                c.Id ==
                                categoryId.Value &&
                                c.IsActive
                        );

                if (category == null)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Selected category is not available."
                        }
                    );
                }

                categoryName = category.Name;
            }

            if (dto.BrandId.HasValue)
            {
                bool brandExists =
                    await _context.Brands.AnyAsync(
                        b =>
                            b.Id ==
                            dto.BrandId.Value &&
                            b.IsActive
                    );

                if (!brandExists)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Selected brand is not available."
                        }
                    );
                }
            }

            string sku =
                string.IsNullOrWhiteSpace(dto.SKU)
                    ? await GenerateSku()
                    : dto.SKU.Trim().ToUpper();

            bool skuExists =
                await _context.Products.AnyAsync(
                    p => p.SKU == sku
                );

            if (skuExists)
            {
                return Conflict(
                    new
                    {
                        message =
                            "SKU already exists."
                    }
                );
            }

            var product = new Product
            {
                Name = dto.Name.Trim(),

                SKU = sku,

                Description =
                    dto.Description?.Trim()
                    ?? string.Empty,

                CategoryId = categoryId,

                BrandId = dto.BrandId,

                PurchasePrice =
                    dto.PurchasePrice,

                // Existing Price field is used
                // as Selling Price.
                Price =
                    dto.SellingPrice,

                MinimumStockLevel =
                    dto.MinimumStockLevel,

                IsActive = true,

                // Compatibility with older code/data.
                Category = categoryName
            };

            _context.Products.Add(product);

            await _context.SaveChangesAsync();

            await LogActivity(
                product.Name,
                "Added",
                userName,
                userRole
            );

            return CreatedAtAction(
                nameof(GetOne),
                new
                {
                    id = product.Id
                },
                await ToResponseDto(product)
            );
        }

        [HttpPost("bulk-import")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> BulkImport(
    IFormFile file,
    [FromHeader(Name = "X-User-Name")]
            string userName,
    [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(
                    new { message = "Please choose an Excel file to upload." }
                );
            }

            if (!file.FileName.ToLower().EndsWith(".xlsx"))
            {
                return BadRequest(
                    new { message = "Only .xlsx files are supported." }
                );
            }

            using var stream = file.OpenReadStream();
            using var workbook = new XLWorkbook(stream);
            var sheet = workbook.Worksheets.First();

            // Read the header row so columns can be in any order.
            var columns = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            foreach (var cell in sheet.Row(1).CellsUsed())
            {
                var header = cell.GetString().Trim();

                if (!string.IsNullOrWhiteSpace(header))
                {
                    columns[header] = cell.Address.ColumnNumber;
                }
            }

            string[] requiredColumns = { "Name", "PurchasePrice", "SellingPrice" };

            var missingColumns =
                requiredColumns.Where(c => !columns.ContainsKey(c)).ToList();

            if (missingColumns.Any())
            {
                return BadRequest(
                    new
                    {
                        message =
                            $"The Excel file is missing required column(s): {string.Join(", ", missingColumns)}."
                    }
                );
            }

            string ReadCell(IXLRow row, string column) =>
                columns.ContainsKey(column)
                    ? row.Cell(columns[column]).GetString().Trim()
                    : string.Empty;

            var categories =
                await _context.Categories.Where(c => c.IsActive).ToListAsync();

            var brands =
                await _context.Brands.Where(b => b.IsActive).ToListAsync();

            var existingSkus = new HashSet<string>(
                await _context.Products
                    .Where(p => p.SKU != null)
                    .Select(p => p.SKU!)
                    .ToListAsync(),
                StringComparer.OrdinalIgnoreCase
            );

            var skusUsedInFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var errors = new List<BulkImportRowError>();
            var newProducts = new List<Product>();

            int lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;

            int nextAutoNumber =
                (await _context.Products.MaxAsync(p => (int?)p.Id) ?? 0) + 1;

            for (int rowNumber = 2; rowNumber <= lastRow; rowNumber++)
            {
                var row = sheet.Row(rowNumber);

                if (row.IsEmpty())
                {
                    continue;
                }

                var name = ReadCell(row, "Name");

                if (string.IsNullOrWhiteSpace(name))
                {
                    errors.Add(new BulkImportRowError
                    {
                        Row = rowNumber,
                        Message = "Name is required."
                    });
                    continue;
                }

                var sku = ReadCell(row, "SKU").ToUpper();
                var description = ReadCell(row, "Description");
                var categoryName = ReadCell(row, "Category");
                var brandName = ReadCell(row, "Brand");

                int? categoryId = null;

                if (!string.IsNullOrWhiteSpace(categoryName))
                {
                    var category = categories.FirstOrDefault(
                        c => c.Name.Equals(categoryName, StringComparison.OrdinalIgnoreCase)
                    );

                    if (category == null)
                    {
                        errors.Add(new BulkImportRowError
                        {
                            Row = rowNumber,
                            Message = $"Category '{categoryName}' was not found."
                        });
                        continue;
                    }

                    categoryId = category.Id;
                }

                int? brandId = null;

                if (!string.IsNullOrWhiteSpace(brandName))
                {
                    var brand = brands.FirstOrDefault(
                        b => b.Name.Equals(brandName, StringComparison.OrdinalIgnoreCase)
                    );

                    if (brand == null)
                    {
                        errors.Add(new BulkImportRowError
                        {
                            Row = rowNumber,
                            Message = $"Brand '{brandName}' was not found."
                        });
                        continue;
                    }

                    brandId = brand.Id;
                }

                if (!decimal.TryParse(ReadCell(row, "PurchasePrice"), out var purchasePrice)
                    || purchasePrice < 0)
                {
                    errors.Add(new BulkImportRowError
                    {
                        Row = rowNumber,
                        Message = "Purchase price must be a valid number, 0 or greater."
                    });
                    continue;
                }

                if (!decimal.TryParse(ReadCell(row, "SellingPrice"), out var sellingPrice)
                    || sellingPrice < 0)
                {
                    errors.Add(new BulkImportRowError
                    {
                        Row = rowNumber,
                        Message = "Selling price must be a valid number, 0 or greater."
                    });
                    continue;
                }

                if (purchasePrice > sellingPrice)
                {
                    errors.Add(new BulkImportRowError
                    {
                        Row = rowNumber,
                        Message = "Selling price should not be lower than purchase price."
                    });
                    continue;
                }

                var minStockText = ReadCell(row, "MinimumStockLevel");
                int minimumStockLevel = 0;

                if (!string.IsNullOrWhiteSpace(minStockText)
                    && (!int.TryParse(minStockText, out minimumStockLevel)
                        || minimumStockLevel < 0))
                {
                    errors.Add(new BulkImportRowError
                    {
                        Row = rowNumber,
                        Message = "Minimum stock level must be a whole number, 0 or greater."
                    });
                    continue;
                }

                var isActiveText = ReadCell(row, "IsActive");
                bool isActive = true;

                if (!string.IsNullOrWhiteSpace(isActiveText))
                {
                    var value = isActiveText.Trim().ToUpper();
                    isActive = value == "TRUE" || value == "YES" || value == "1";
                }

                if (!string.IsNullOrWhiteSpace(sku))
                {
                    if (existingSkus.Contains(sku) || skusUsedInFile.Contains(sku))
                    {
                        errors.Add(new BulkImportRowError
                        {
                            Row = rowNumber,
                            Message = $"SKU '{sku}' already exists."
                        });
                        continue;
                    }
                }
                else
                {
                    do
                    {
                        sku = $"PRD-{nextAutoNumber:0000}";
                        nextAutoNumber++;
                    }
                    while (existingSkus.Contains(sku) || skusUsedInFile.Contains(sku));
                }

                skusUsedInFile.Add(sku);

                newProducts.Add(new Product
                {
                    Name = name,
                    SKU = sku,
                    Description = description,
                    CategoryId = categoryId,
                    Category = categoryName,
                    BrandId = brandId,
                    PurchasePrice = purchasePrice,
                    Price = sellingPrice,
                    MinimumStockLevel = minimumStockLevel,
                    IsActive = isActive
                });
            }

            // All-or-nothing: if any row has a problem, nothing is saved.
            // This keeps the import predictable and easy to fix.
            if (errors.Any())
            {
                return BadRequest(
                    new
                    {
                        message =
                            $"{errors.Count} row(s) could not be imported. Fix them and upload the file again.",
                        details = errors
                    }
                );
            }

            if (!newProducts.Any())
            {
                return BadRequest(
                    new { message = "No product rows were found in the Excel file." }
                );
            }

            _context.Products.AddRange(newProducts);

            await _context.SaveChangesAsync();

            await LogActivity(
                $"{newProducts.Count} product(s)",
                "Bulk Imported",
                userName,
                userRole
            );

            return Ok(
                new
                {
                    message = $"{newProducts.Count} product(s) imported successfully.",
                    imported = newProducts.Count
                }
            );
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            UpdateProductDto dto,
            [FromHeader(Name = "X-User-Name")]
            string userName,
            [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            var product =
                await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Product not found."
                    }
                );
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Product name is required."
                    }
                );
            }

            if (dto.PurchasePrice < 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Purchase price cannot be negative."
                    }
                );
            }

            if (dto.SellingPrice < 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Selling price cannot be negative."
                    }
                );
            }

            if (dto.MinimumStockLevel < 0)
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Minimum stock level cannot be negative."
                    }
                );
            }

            if (
                dto.PurchasePrice >
                dto.SellingPrice
            )
            {
                return BadRequest(
                    new
                    {
                        message =
                            "Selling price should not be lower than purchase price."
                    }
                );
            }

            var sku =
                string.IsNullOrWhiteSpace(dto.SKU)
                    ? product.SKU
                    : dto.SKU.Trim().ToUpper();

            if (string.IsNullOrWhiteSpace(sku))
            {
                sku = await GenerateSku(product.Id);
            }

            bool skuExists =
                await _context.Products.AnyAsync(
                    p =>
                        p.Id != id &&
                        p.SKU == sku
                );

            if (skuExists)
            {
                return Conflict(
                    new
                    {
                        message =
                            "SKU already exists."
                    }
                );
            }

            string categoryName =
                string.Empty;

            if (dto.CategoryId.HasValue)
            {
                var category =
                    await _context.Categories
                        .FirstOrDefaultAsync(
                            c =>
                                c.Id ==
                                dto.CategoryId.Value &&
                                c.IsActive
                        );

                if (category == null)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Selected category is not available."
                        }
                    );
                }

                categoryName = category.Name;
            }

            if (dto.BrandId.HasValue)
            {
                bool brandExists =
                    await _context.Brands.AnyAsync(
                        b =>
                            b.Id ==
                            dto.BrandId.Value &&
                            b.IsActive
                    );

                if (!brandExists)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Selected brand is not available."
                        }
                    );
                }
            }

            product.Name = dto.Name.Trim();

            product.SKU = sku;

            product.Description =
                dto.Description?.Trim()
                ?? string.Empty;

            product.CategoryId =
                dto.CategoryId;

            product.BrandId =
                dto.BrandId;

            product.Category =
                categoryName;

            product.PurchasePrice =
                dto.PurchasePrice;

            product.Price =
                dto.SellingPrice;

            product.MinimumStockLevel =
                dto.MinimumStockLevel;

            product.IsActive =
                dto.IsActive;

            await _context.SaveChangesAsync();

            await LogActivity(
                product.Name,
                "Updated",
                userName,
                userRole
            );

            return Ok(
                await ToResponseDto(product)
            );
        }

        [HttpPut("{id}/activate")]
        public async Task<IActionResult> Activate(
            int id,
            [FromHeader(Name = "X-User-Name")]
            string userName,
            [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            return await SetActive(
                id,
                true,
                userName,
                userRole
            );
        }

        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(
            int id,
            [FromHeader(Name = "X-User-Name")]
            string userName,
            [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            return await SetActive(
                id,
                false,
                userName,
                userRole
            );
        }

        private async Task<IActionResult> SetActive(
            int id,
            bool active,
            string userName,
            string userRole)
        {
            var product =
                await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Product not found."
                    }
                );
            }

            product.IsActive = active;

            await _context.SaveChangesAsync();

            await LogActivity(
                product.Name,
                active
                    ? "Activated"
                    : "Deactivated",
                userName,
                userRole
            );

            return Ok(
                new
                {
                    message =
                        active
                            ? "Product activated."
                            : "Product deactivated."
                }
            );
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(
            int id,
            [FromHeader(Name = "X-User-Name")]
            string userName,
            [FromHeader(Name = "X-User-Role")]
            string userRole)
        {
            var product =
                await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Product not found."
                    }
                );
            }

            // Products that participate in inventory or transaction history
            // should not be hard-deleted. Deactivate them instead so the
            // historical data remains intact and the UI does not receive a
            // misleading 400/500 error.
            bool hasStock =
                await _context.ProductStocks.AnyAsync(
                    ps =>
                        ps.ProductId == id &&
                        ps.Quantity != 0
                );

            bool hasPurchaseHistory =
                await _context.PurchaseOrderItems.AnyAsync(
                    item => item.ProductId == id
                );

            bool hasSalesHistory =
                await _context.SalesOrderItems.AnyAsync(
                    item => item.ProductId == id
                );

            string productName = product.Name;

            if (hasStock || hasPurchaseHistory || hasSalesHistory)
            {
                product.IsActive = false;

                await _context.SaveChangesAsync();

                await LogActivity(
                    productName,
                    "Deactivated",
                    userName,
                    userRole
                );

                return Ok(
                    new
                    {
                        deleted = false,
                        deactivated = true,
                        message =
                            $"{productName} was deactivated because it has inventory or transaction history."
                    }
                );
            }

            _context.Products.Remove(product);

            await _context.SaveChangesAsync();

            await LogActivity(
                productName,
                "Deleted",
                userName,
                userRole
            );

            return Ok(
                new
                {
                    deleted = true,
                    deactivated = false,
                    message =
                        $"{productName} deleted."
                }
            );
        }

        private async Task<string> GenerateSku(
            int? productId = null)
        {
            int nextNumber =
                (await _context.Products
                    .MaxAsync(
                        p => (int?)p.Id
                    ) ?? 0) + 1;

            string sku =
                $"PRD-{nextNumber:0000}";

            while (
                await _context.Products.AnyAsync(
                    p =>
                        p.SKU == sku &&
                        (!productId.HasValue ||
                         p.Id != productId.Value)
                )
            )
            {
                nextNumber++;

                sku =
                    $"PRD-{nextNumber:0000}";
            }

            return sku;
        }
    }
}