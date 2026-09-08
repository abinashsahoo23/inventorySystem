namespace InventoryApi.DTOs
{
    public class WarehouseDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public int EmployeeCount { get; set; }

        public int TotalStock { get; set; }
    }

    public class CreateWarehouseDto
    {
        public string Name { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;
    }

    public class UpdateWarehouseDto
    {
        public string Name { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;
    }

    public class WarehouseEmployeeDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;
    }

    public class AssignWarehouseEmployeeDto
    {
        public int UserId { get; set; }
    }
}
