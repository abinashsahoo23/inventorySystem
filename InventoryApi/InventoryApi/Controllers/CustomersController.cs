using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.DTOs;

namespace InventoryApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CustomersController(AppDbContext context) => _context = context;

        private static CustomerDto ToDto(Customer c) => new()
        {
            Id = c.Id,
            Name = c.Name,
            Phone = c.Phone,
            Email = c.Email,
            Address = c.Address
        };

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var customers = await _context.Customers.OrderBy(c => c.Name).ToListAsync();
            return Ok(customers.Select(ToDto));
        }

        [HttpPost]
        public async Task<IActionResult> Create(CustomerInputDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Customer name is required." });

            var customer = new Customer
            {
                Name = dto.Name,
                Phone = dto.Phone,
                Email = dto.Email,
                Address = dto.Address
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return Ok(ToDto(customer));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CustomerInputDto dto)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound(new { message = "Customer not found." });

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Customer name is required." });

            customer.Name = dto.Name;
            customer.Phone = dto.Phone;
            customer.Email = dto.Email;
            customer.Address = dto.Address;

            await _context.SaveChangesAsync();
            return Ok(ToDto(customer));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound(new { message = "Customer not found." });

            var hasOrders = await _context.SalesOrders.AnyAsync(so => so.CustomerId == id);
            if (hasOrders)
                return BadRequest(new { message = "Cannot delete a customer with existing sales orders." });

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Customer deleted." });
        }
    }
}