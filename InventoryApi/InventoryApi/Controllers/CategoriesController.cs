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
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _context.Categories
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.IsActive,
                    ProductCount = c.Products.Count
                })
                .ToListAsync();

            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOne(int id)
        {
            var category = await _context.Categories
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.IsActive,
                    ProductCount = c.Products.Count
                })
                .FirstOrDefaultAsync();

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            return Ok(category);
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            Category category)
        {
            var name = category.Name.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new
                {
                    message = "Category name is required."
                });
            }

            bool exists = await _context.Categories.AnyAsync(
                c => c.Name.ToLower() == name.ToLower()
            );

            if (exists)
            {
                return Conflict(new
                {
                    message = "Category already exists."
                });
            }

            var newCategory = new Category
            {
                Name = name,
                IsActive = true
            };

            _context.Categories.Add(newCategory);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetOne),
                new { id = newCategory.Id },
                new
                {
                    newCategory.Id,
                    newCategory.Name,
                    newCategory.IsActive,
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
                await _context.Categories.Select(c => c.Name).ToListAsync(),
                StringComparer.OrdinalIgnoreCase
            );

            var namesUsedInFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var errors = new List<BulkImportRowError>();
            var newCategories = new List<Category>();

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
                        Message = $"Category '{name}' already exists."
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

                newCategories.Add(new Category
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

            if (!newCategories.Any())
            {
                return BadRequest(new
                {
                    message = "No category rows were found in the Excel file."
                });
            }

            _context.Categories.AddRange(newCategories);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    $"{newCategories.Count} categor{(newCategories.Count == 1 ? "y" : "ies")} imported successfully.",
                imported = newCategories.Count
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            Category category)
        {
            var existing = await _context.Categories
                .FindAsync(id);

            if (existing == null)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            var name = category.Name.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new
                {
                    message = "Category name is required."
                });
            }

            bool exists = await _context.Categories.AnyAsync(
                c =>
                    c.Id != id &&
                    c.Name.ToLower() == name.ToLower()
            );

            if (exists)
            {
                return Conflict(new
                {
                    message = "Category already exists."
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
                    p => p.CategoryId == existing.Id
                )
            });
        }

        [HttpPut("{id}/activate")]
        public async Task<IActionResult> Activate(int id)
        {
            var category = await _context.Categories
                .FindAsync(id);

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            category.IsActive = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Category activated."
            });
        }

        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var category = await _context.Categories
                .FindAsync(id);

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            bool hasProducts = await _context.Products
                .AnyAsync(p => p.CategoryId == id);

            if (hasProducts)
            {
                return BadRequest(new
                {
                    message =
                        "Category cannot be deactivated while products are using it."
                });
            }

            category.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Category deactivated."
            });
        }
    }
}