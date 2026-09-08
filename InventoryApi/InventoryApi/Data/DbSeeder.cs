using InventoryApi.Models;

namespace InventoryApi.Data
{
    public static class DbSeeder
    {
        public static void Seed(AppDbContext context)
        {
            SeedRoles(context);
            SeedPermissions(context);
            SeedRolePermissions(context);
            SeedWarehouses(context);
            SeedAdmin(context);
        }

        private static void SeedRoles(AppDbContext context)
        {
            var roles = new[]
            {
                new Role
                {
                    Name = "Unassigned",
                    Description = "New account waiting for role assignment."
                },
                new Role
                {
                    Name = "SuperAdmin",
                    Description = "Controls the entire system."
                },
                new Role
                {
                    Name = "InventoryManager",
                    Description = "Manages products and stock."
                },
                new Role
                {
                    Name = "WarehouseManager",
                    Description = "Manages warehouse activities."
                },
                new Role
                {
                    Name = "PurchaseOfficer",
                    Description = "Handles buying and suppliers."
                },
                new Role
                {
                    Name = "SalesOfficer",
                    Description = "Handles selling and customers."
                },
                new Role
                {
                    Name = "Accountant",
                    Description = "Handles financial information."
                },
                new Role
                {
                    Name = "Staff",
                    Description = "Performs basic assigned work."
                }
            };

            foreach (var role in roles)
            {
                bool exists = context.Roles.Any(
                    r => r.Name == role.Name
                );

                if (!exists)
                {
                    context.Roles.Add(role);
                }
            }

            context.SaveChanges();
        }

        private static void SeedPermissions(AppDbContext context)
        {
            var permissions = new[]
            {
                ("User.View", "User"),
                ("User.Approve", "User"),
                ("User.AssignRole", "User"),
                ("User.Activate", "User"),
                ("User.Deactivate", "User"),
                ("User.Delete", "User"),

                ("Product.View", "Product"),
                ("Product.Create", "Product"),
                ("Product.Update", "Product"),
                ("Product.Delete", "Product"),

                ("Inventory.View", "Inventory"),
                ("Inventory.StockIn", "Inventory"),
                ("Inventory.StockOut", "Inventory"),
                ("Inventory.Adjust", "Inventory"),

                ("Warehouse.View", "Warehouse"),
                ("Warehouse.Create", "Warehouse"),
                ("Warehouse.Transfer", "Warehouse"),

                ("Supplier.View", "Supplier"),
                ("Supplier.Create", "Supplier"),

                ("Purchase.View", "Purchase"),
                ("Purchase.Create", "Purchase"),

                ("Sales.View", "Sales"),
                ("Sales.Create", "Sales"),

                ("Reports.View", "Reports")
            };

            foreach (var (name, module) in permissions)
            {
                bool exists = context.Permissions.Any(
                    p => p.Name == name
                );

                if (!exists)
                {
                    context.Permissions.Add(
                        new Permission
                        {
                            Name = name,
                            Module = module
                        }
                    );
                }
            }

            context.SaveChanges();
        }

        private static void SeedRolePermissions(AppDbContext context)
        {
            var roleIdByName = context.Roles.ToDictionary(
                r => r.Name,
                r => r.Id
            );

            var permIdByName = context.Permissions.ToDictionary(
                p => p.Name,
                p => p.Id
            );

            void Grant(
                string roleName,
                params string[] permissionNames)
            {
                if (!roleIdByName.TryGetValue(
                    roleName,
                    out var roleId))
                {
                    return;
                }

                foreach (var permissionName in permissionNames)
                {
                    if (!permIdByName.TryGetValue(
                        permissionName,
                        out var permissionId))
                    {
                        continue;
                    }

                    bool exists = context.RolePermissions.Any(
                        rp =>
                            rp.RoleId == roleId &&
                            rp.PermissionId == permissionId
                    );

                    if (!exists)
                    {
                        context.RolePermissions.Add(
                            new RolePermission
                            {
                                RoleId = roleId,
                                PermissionId = permissionId
                            }
                        );
                    }
                }
            }

            Grant(
                "SuperAdmin",
                permIdByName.Keys.ToArray()
            );

            Grant(
                "InventoryManager",
                "Product.View",
                "Product.Create",
                "Product.Update",
                "Product.Delete",
                "Inventory.View",
                "Inventory.StockIn",
                "Inventory.StockOut",
                "Inventory.Adjust"
            );

            Grant(
                "WarehouseManager",
                "Warehouse.View",
                "Warehouse.Create",
                "Warehouse.Transfer",
                "Inventory.View"
            );

            Grant(
                "PurchaseOfficer",
                "Supplier.View",
                "Supplier.Create",
                "Purchase.View",
                "Purchase.Create",
                "Product.View"
            );

            Grant(
                "SalesOfficer",
                "Sales.View",
                "Sales.Create",
                "Product.View"
            );

            Grant(
                "Accountant",
                "Reports.View",
                "Sales.View",
                "Purchase.View"
            );

            Grant(
                "Staff",
                "Product.View",
                "Inventory.View"
            );

            context.SaveChanges();
        }

        private static void SeedWarehouses(AppDbContext context)
        {
            if (context.Warehouses.Any())
            {
                return;
            }

            context.Warehouses.Add(
                new Warehouse
                {
                    Name = "Main Warehouse",
                    Location = "Default"
                }
            );

            context.SaveChanges();
        }

        private static void SeedAdmin(AppDbContext context)
        {
            bool adminExists = context.Users.Any(
                u => u.Email == "admin@inventory.com"
            );

            if (adminExists)
            {
                return;
            }

            var superAdmin = context.Roles.First(
                r => r.Name == "SuperAdmin"
            );

            context.Users.Add(
                new User
                {
                    Name = "Super Admin",
                    Email = "admin@inventory.com",
                    Phone = "9999999999",
                    Password = "Admin@123",
                    RoleId = superAdmin.Id,
                    Status = "Active"
                }
            );

            context.SaveChanges();
        }
    }
}