export const ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  INVENTORY_MANAGER: "InventoryManager",
  WAREHOUSE_MANAGER: "WarehouseManager",
  PURCHASE_OFFICER: "PurchaseOfficer",
  SALES_OFFICER: "SalesOfficer",
  ACCOUNTANT: "Accountant",
  STAFF: "Staff",
};

export const ALL_ROLES = Object.values(ROLES);

export const ROUTES = {
  dashboard: {
    path: "/dashboard",
    roles: ALL_ROLES,
    label: "Dashboard",
    icon: "bi-grid-1x2",
  },

  admin: {
    path: "/admin",
    roles: [
      ROLES.SUPER_ADMIN,
    ],
    label: "Admin Dashboard",
    icon: "bi-speedometer2",
  },

  products: {
    path: "/products",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.INVENTORY_MANAGER,
    ],
    label: "Products",
    icon: "bi-box-seam",
  },

  catalog: {
    path: "/catalog",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.INVENTORY_MANAGER,
    ],
    label: "Categories & Brands",
    icon: "bi-tags",
  },

  inventory: {
    path: "/inventory",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.INVENTORY_MANAGER,
      ROLES.WAREHOUSE_MANAGER,
    ],
    label: "Inventory",
    icon: "bi-boxes",
  },

  lowStock: {
    path: "/low-stock",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.INVENTORY_MANAGER,
      ROLES.WAREHOUSE_MANAGER,
    ],
    label: "Low Stock",
    icon: "bi-exclamation-triangle",
  },

  warehouses: {
    path: "/warehouses",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.WAREHOUSE_MANAGER,
    ],
    label: "Warehouses",
    icon: "bi-building",
  },

  suppliers: {
    path: "/suppliers",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.PURCHASE_OFFICER,
    ],
    label: "Suppliers",
    icon: "bi-truck",
  },

  purchases: {
    path: "/purchases",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.PURCHASE_OFFICER,
    ],
    label: "Purchase Orders",
    icon: "bi-cart-check",
  },

  customers: {
    path: "/customers",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.SALES_OFFICER,
    ],
    label: "Customers",
    icon: "bi-people",
  },

  sales: {
    path: "/sales",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.SALES_OFFICER,
    ],
    label: "Sales Orders",
    icon: "bi-receipt",
  },

  tasks: {
    path: "/tasks",
    roles: ALL_ROLES,
    label: "Tasks",
    icon: "bi-list-task",
  },

  settings: {
    path: "/settings",
    roles: ALL_ROLES,
    label: "Settings",
    icon: "bi-gear",
  },

  finance: {
  path: "/finance",
  roles: [
    ROLES.SUPER_ADMIN,
    ROLES.ACCOUNTANT,
  ],
  label: "Finance",
  icon: "bi-cash-stack",
},

 reports: {
  path: "/reports",
  roles: [
    ROLES.SUPER_ADMIN,
    ROLES.INVENTORY_MANAGER,
    ROLES.WAREHOUSE_MANAGER,
    ROLES.PURCHASE_OFFICER,
    ROLES.SALES_OFFICER,
    ROLES.ACCOUNTANT,
  ],
  label: "Reports",
  icon: "bi-bar-chart",
},

notifications: {
  path: "/notifications",
  roles: ALL_ROLES,
  label: "Notifications",
  icon: "bi-bell",
},


};

export function canAccess(route, role) {
  return Boolean(
    route &&
    role &&
    route.roles.includes(role)
  );
}

export function getSidebarItems(role) {
  const items = [];

  if (role === ROLES.SUPER_ADMIN) {
    items.push(ROUTES.admin);
  } else {
    items.push(ROUTES.dashboard);
  }

  const moduleRoutes = [
    ROUTES.products,
    ROUTES.catalog,
    ROUTES.inventory,
    ROUTES.lowStock,
    ROUTES.warehouses,
    ROUTES.suppliers,
    ROUTES.purchases,
    ROUTES.customers,
    ROUTES.sales,
    ROUTES.tasks,
    ROUTES.finance,
    ROUTES.reports,
    ROUTES.notifications,
    ROUTES.settings,
  ];

  return [
    ...items,
    ...moduleRoutes.filter(
      (route) =>
        canAccess(route, role)
    ),
  ];
}