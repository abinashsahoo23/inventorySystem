import { getCurrentUser } from "./components/auth/session";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://localhost:7251/api";

function currentUserHeaders() {
  const user = getCurrentUser();

  return {
    "X-User-Name": user?.name || "Unknown",
    "X-User-Role": user?.role || "User",
    "X-User-Email": user?.email || "",
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...currentUserHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

function get(path, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const queryString = query.toString();

  return request(`${path}${queryString ? `?${queryString}` : ""}`);
}

function post(path, body) {
  return request(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function put(path, body) {
  return request(path, {
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function remove(path) {
  return request(path, {
    method: "DELETE",
  });
}

// File uploads use FormData, not JSON — so this skips the
// "Content-Type: application/json" header and lets the browser
// set the correct multipart boundary automatically.
async function postFile(path, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...currentUserHeaders(),
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong.");
    error.details = data.details || [];
    throw error;
  }

  return data;
}

export const api = {

  login: (email, password) =>
    post("/auth/login", {
      email,
      password,
    }),

  register: (name, email, phone, password) =>
    post("/auth/register", {
      name,
      email,
      phone,
      password,
    }),

  changePassword: (email, currentPassword, newPassword) =>
    put("/users/change-password", {
      email,
      currentPassword,
      newPassword,
    }),

  getUsers: () =>
    get("/users"),

  getPendingUsers: () =>
    get("/users/pending"),

  createUser: (user) =>
    post("/users", user),

  updateUser: (id, user) =>
    put(`/users/${id}`, user),

  updateMyProfile: (name, phone) =>
    put("/users/me", { name, phone }),

  getMyAccountInfo: () =>
    get("/users/me"),

  approveUser: (id) =>
    put(`/users/${id}/approve`),

  activateUser: (id) =>
    put(`/users/${id}/activate`),

  deactivateUser: (id) =>
    put(`/users/${id}/deactivate`),

  assignRole: (id, roleId) =>
    put(`/users/${id}/role`, {
      roleId,
    }),

  deleteUser: (id) =>
    remove(`/users/${id}`),

  getRoles: () =>
    get("/roles"),

  getAllPermissions: () =>
    get("/roles/permissions"),

  getRolePermissions: (id) =>
    get(`/roles/${id}/permissions`),

  updateRolePermissions: (id, permissionIds) =>
    put(`/roles/${id}/permissions`, {
      permissionIds,
    }),

  getAdminOverview: () =>
    get("/admin/overview"),

  getActivityLogs: (entityType) =>
    get("/activitylogs", {
      entityType,
    }),

  getProducts: (search, categoryId, brandId, activeOnly) =>
    get("/products", {
      search,
      categoryId,
      brandId,
      activeOnly,
    }),

  getProduct: (id) =>
    get(`/products/${id}`),

  addProduct: (product) =>
    post("/products", product),

  updateProduct: (id, product) =>
    put(`/products/${id}`, product),

  activateProduct: (id) =>
    put(`/products/${id}/activate`),

  deactivateProduct: (id) =>
    put(`/products/${id}/deactivate`),

  deleteProduct: (id) =>
    remove(`/products/${id}`),

  bulkImportProducts: (file) =>
    postFile("/products/bulk-import", file),

  getCategories: () =>
    get("/categories"),

  getCategory: (id) =>
    get(`/categories/${id}`),

  addCategory: (category) =>
    post("/categories", category),

  updateCategory: (id, category) =>
    put(`/categories/${id}`, category),

  activateCategory: (id) =>
    put(`/categories/${id}/activate`),

  deactivateCategory: (id) =>
    put(`/categories/${id}/deactivate`),

  bulkImportCategories: (file) =>
    postFile("/categories/bulk-import", file),

  getBrands: () =>
    get("/brands"),

  getBrand: (id) =>
    get(`/brands/${id}`),

  addBrand: (brand) =>
    post("/brands", brand),

  updateBrand: (id, brand) =>
    put(`/brands/${id}`, brand),

  activateBrand: (id) =>
    put(`/brands/${id}/activate`),

  deactivateBrand: (id) =>
    put(`/brands/${id}/deactivate`),

  bulkImportBrands: (file) =>
    postFile("/brands/bulk-import", file),

  getWarehouses: () =>
    get("/warehouses"),

  addWarehouse: (warehouse) =>
    post("/warehouses", warehouse),

  updateWarehouse: (id, warehouse) =>
    put(`/warehouses/${id}`, warehouse),

  deleteWarehouse: (id) =>
    remove(`/warehouses/${id}`),

  getWarehouseStock: (id) =>
    get(`/warehouses/${id}/stock`),

  getWarehouseEmployees: (id) =>
    get(`/warehouses/${id}/employees`),

  assignWarehouseEmployee: (warehouseId, userId) =>
    put(`/warehouses/${warehouseId}/employees`, {
      userId,
    }),

  removeWarehouseEmployee: (warehouseId, userId) =>
    remove(`/warehouses/${warehouseId}/employees/${userId}`),

  activateWarehouse: (id) =>
    put(`/warehouses/${id}/activate`),

  deactivateWarehouse: (id) =>
    put(`/warehouses/${id}/deactivate`),

  getStockTotals: () =>
    get("/inventory/stock/totals"),

  getStock: (productId, warehouseId) =>
    get("/inventory/stock", {
      productId,
      warehouseId,
    }),

  stockIn: (productId, warehouseId, quantity, reason) =>
    post("/inventory/stock-in", {
      productId,
      warehouseId,
      quantity,
      reason,
    }),

  stockOut: (productId, warehouseId, quantity, reason) =>
    post("/inventory/stock-out", {
      productId,
      warehouseId,
      quantity,
      reason,
    }),

  adjustStock: (productId, warehouseId, newQuantity, reason) =>
    post("/inventory/adjust", {
      productId,
      warehouseId,
      newQuantity,
      reason,
    }),

  transferStock: (
    productId,
    fromWarehouseId,
    toWarehouseId,
    quantity,
    reason
  ) =>
    post("/inventory/transfer", {
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      reason,
    }),

  getStockHistory: (productId, warehouseId, take) =>
    get("/inventory/history", {
      productId,
      warehouseId,
      take,
    }),

  getLowStock: (threshold) =>
    get("/inventory/low-stock", {
      threshold,
    }),

  getSuppliers: (search, activeOnly) =>
    get("/suppliers", {
      search,
      activeOnly,
    }),

  getSupplier: (id) =>
    get(`/suppliers/${id}`),

  getSupplierHistory: (id) =>
    get(`/suppliers/${id}/history`),

  addSupplier: (supplier) =>
    post("/suppliers", supplier),

  updateSupplier: (id, supplier) =>
    put(`/suppliers/${id}`, supplier),

  activateSupplier: (id) =>
    put(`/suppliers/${id}/activate`),

  deactivateSupplier: (id) =>
    put(`/suppliers/${id}/deactivate`),

  deleteSupplier: (id) =>
    remove(`/suppliers/${id}`),

  getPurchaseOrders: (status) =>
    get("/purchase/orders", {
      status,
    }),

  getPurchaseOrder: (id) =>
    get(`/purchase/orders/${id}`),

  createPurchaseOrder: (order) =>
    post("/purchase/orders", order),

  receivePurchaseOrder: (id) =>
    post(`/purchase/orders/${id}/receive`),

  cancelPurchaseOrder: (id) =>
    post(`/purchase/orders/${id}/cancel`),

  getCustomers: () =>
    get("/customers"),

  addCustomer: (customer) =>
    post("/customers", customer),

  updateCustomer: (id, customer) =>
    put(`/customers/${id}`, customer),

  deleteCustomer: (id) =>
    remove(`/customers/${id}`),

  getSalesOrders: (status) =>
    get("/sales/orders", {
      status,
    }),

  getSalesOrder: (id) =>
    get(`/sales/orders/${id}`),

  getSalesInvoice: (id) =>
    get(`/sales/orders/${id}/invoice`),

  createSalesOrder: (order) =>
    post("/sales/orders", order),

  completeSalesOrder: (id) =>
    post(`/sales/orders/${id}/complete`),

  cancelSalesOrder: (id) =>
    post(`/sales/orders/${id}/cancel`),

  getTasks: (status) =>
    get("/tasks", {
      status,
    }),

  getMyTasks: (status) =>
    get("/tasks/my", {
      status,
    }),

  getTask: (id) =>
    get(`/tasks/${id}`),

  getTaskHistory: (id) =>
    get(`/tasks/${id}/history`),

  createTask: (task) =>
    post("/tasks", task),

  updateTask: (id, task) =>
    put(`/tasks/${id}`, task),

  updateTaskStatus: (id, status) =>
    put(`/tasks/${id}/status`, {
      status,
    }),

  deleteTask: (id) =>
    remove(`/tasks/${id}`),

  getFinanceSummary: () =>
    get("/finance/summary"),

  getExpenses: () =>
    get("/finance/expenses"),

  addExpense: (expense) =>
    post("/finance/expenses", expense),

  updateExpense: (id, expense) =>
    put(`/finance/expenses/${id}`, expense),

  deleteExpense: (id) =>
    remove(`/finance/expenses/${id}`),

  getFinanceInvoices: () =>
    get("/finance/invoices"),

  getInventoryReport: () =>
    get("/reports/inventory"),

  getSalesReport: (status) =>
    get("/reports/sales", {
      status,
    }),

  getPurchaseReport: (status) =>
    get("/reports/purchases", {
      status,
    }),

  getStockMovementReport: (type) =>
    get("/reports/stock-movements", {
      type,
    }),

  getLowStockReport: (threshold) =>
    get("/reports/low-stock", {
      threshold,
    }),

  getUserActivityReport: (user, entityType) =>
    get("/reports/user-activity", {
      user,
      entityType,
    }),


  getNotifications: (unreadOnly = false) =>
    get("/notifications", {
      unreadOnly,
    }),

  getNotificationCount: () =>
    get("/notifications/count"),

  markNotificationAsRead: (id) =>
    put(`/notifications/${id}/read`),

  markAllNotificationsAsRead: () =>
    put("/notifications/read-all"),

  deleteNotification: (id) =>
    remove(`/notifications/${id}`),

  getNotificationPreferences: () =>
    get("/notifications/preferences"),

  updateNotificationPreferences: (prefs) =>
    put("/notifications/preferences", prefs),
};