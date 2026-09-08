using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.DTOs;
using ClosedXML.Excel;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BrandsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BrandsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var brands = await _context.Brands
                .OrderBy(b => b.Name)
                .Select(b => new
                {
                    b.Id,
                    b.Name,
                    b.IsActive,
                    ProductCount = b.Products.Count
                })
                .ToListAsync();

            return Ok(brands);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOne(int id)
        {
            var brand = await _context.Brands
                .Where(b => b.Id == id)
                .Select(b => new
                {
                    b.Id,
                    b.Name,
                    b.IsActive,
                    ProductCount = b.Products.Count
                })
                .FirstOrDefaultAsync();

            if (brand == null)
            {
                return NotFound(new
                {
                    message = "Brand not found."
                });
            }

            return Ok(brand);
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            Brand brand)
        {
            var name = brand.Name.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new
                {
                    message = "Brand name is required."
                });
            }

            bool exists = await _context.Brands.AnyAsync(
                b => b.Name.ToLower() == name.ToLower()
            );

            if (exists)
            {
                return Conflict(new
                {
                    message = "Brand already exists."
                });
            }

            var newBrand = new Brand
            {
                Name = name,
                IsActive = true
            };

            _context.Brands.Add(newBrand);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetOne),
                new { id = newBrand.Id },
                new
                {
                    newBrand.Id,
                    newBrand.Name,
                    newBrand.IsActive,
                    ProductCount = 0
                }
            );
        }

        [HttpPost("bulk-import")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> BulkImport(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new
                {
                    message = "Please choose an Excel file to upload."
                });
            }

            if (!file.FileName.ToLower().EndsWith(".xlsx"))
            {
                return BadRequest(new
                {
                    message = "Only .xlsx files are supported."
                });
            }

            using var stream = file.OpenReadStream();
            using var workbook = new XLWorkbook(stream);
            var sheet = workbook.Worksheets.First();

            // Read the header row so the "Name" / "IsActive" columns
            // can be in any order in the file.
            var columns = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            foreach (var cell in sheet.Row(1).CellsUsed())
            {
                var header = cell.GetString().Trim();

                if (!string.IsNullOrWhiteSpace(header))
                {
                    columns[header] = cell.Address.ColumnNumber;
                }
            }

            if (!columns.ContainsKey("Name"))
            {
                return BadRequest(new
                {
                    message = "The Excel file is missing the required 'Name' column."
                });
            }

            string ReadCell(IXLRow row, string column) =>
                columns.ContainsKey(column)
                    ? row.Cell(columns[column]).GetString().Trim()
                    : string.Empty;

            var existingNames = new HashSet<string>(
                await _context.Brands.Select(b => b.Name).ToListAsync(),
                StringComparer.OrdinalIgnoreCase
            );

            var namesUsedInFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var errors = new List<BulkImportRowError>();
            var newBrands = new List<Brand>();

            int lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;

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

                if (existingNames.Contains(name) || namesUsedInFile.Contains(name))
                {
                    errors.Add(new BulkImportRowError
                    {
                        Row = rowNumber,
                        Message = $"Brand '{name}' already exists."
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

                namesUsedInFile.Add(name);

                newBrands.Add(new Brand
                {
                    Name = name,
                    IsActive = isActive
                });
            }

            // All-or-nothing, same as the product import: either every
            // row is clean and gets saved, or nothing is saved and the
            // exact bad rows are reported back.
            if (errors.Any())
            {
                return BadRequest(new
                {
                    message =
                        $"{errors.Count} row(s) could not be imported. Fix them and upload the file again.",
                    details = errors
                });
            }

            if (!newBrands.Any())
            {
                return BadRequest(new
                {
                    message = "No brand rows were found in the Excel file."
                });
            }

            _context.Brands.AddRange(newBrands);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"{newBrands.Count} brand(s) imported successfully.",
                imported = newBrands.Count
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            Brand brand)
        {
            var existing = await _context.Brands
                .FindAsync(id);

            if (existing == null)
            {
                return NotFound(new
                {
                    message = "Brand not found."
                });
            }

            var name = brand.Name.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new
                {
                    message = "Brand name is required."
                });
            }

            bool exists = await _context.Brands.AnyAsync(
                b =>
                    b.Id != id &&
                    b.Name.ToLower() == name.ToLower()
            );

            if (exists)
            {
                return Conflict(new
                {
                    message = "Brand already exists."
                });
            }

            existing.Name = name;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                existing.Id,
                existing.Name,
                existing.IsActive,
                ProductCount = await _context.Products.CountAsync(
                    p => p.BrandId == existing.Id
                )
            });
        }

        [HttpPut("{id}/activate")]
        public async Task<IActionResult> Activate(int id)
        {
            var brand = await _context.Brands
                .FindAsync(id);

            if (brand == null)
            {
                return NotFound(new
                {
                    message = "Brand not found."
                });
            }

            brand.IsActive = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Brand activated."
            });
        }

        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var brand = await _context.Brands
                .FindAsync(id);

            if (brand == null)
            {
                return NotFound(new
                {
                    message = "Brand not found."
                });
            }

            bool hasProducts = await _context.Products
                .AnyAsync(p => p.BrandId == id);

            if (hasProducts)
            {
                return BadRequest(new
                {
                    message =
                        "Brand cannot be deactivated while products are using it."
                });
            }

            brand.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Brand deactivated."
            });
        }
    }
}