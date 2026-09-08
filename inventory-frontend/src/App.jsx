import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Products from "./pages/Products";
import Catalog from "./pages/Catalog";
import Inventory from "./pages/Inventory";
import LowStock from "./pages/LowStock";
import Warehouses from "./pages/Warehouses";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Tasks from "./pages/Tasks";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import { ROUTES } from "./routes/routeConfig";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route element={<ProtectedRoute route={ROUTES.dashboard} />}><Route path="/dashboard" element={<UserDashboard />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.admin} />}><Route path="/admin" element={<AdminDashboard />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.products} />}><Route path="/products" element={<Products />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.catalog} />}><Route path="/catalog" element={<Catalog />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.inventory} />}><Route path="/inventory" element={<Inventory />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.lowStock} />}><Route path="/low-stock" element={<LowStock />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.warehouses} />}><Route path="/warehouses" element={<Warehouses />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.suppliers} />}><Route path="/suppliers" element={<Suppliers />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.purchases} />}><Route path="/purchases" element={<Purchases />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.customers} />}><Route path="/customers" element={<Customers />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.sales} />}><Route path="/sales" element={<Sales />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.tasks} />}><Route path="/tasks" element={<Tasks />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.finance} />}><Route path="/finance" element={<Finance />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.reports} />}><Route path="/reports" element={<Reports />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.notifications} />}><Route path="/notifications" element={<Notifications />} /></Route>
            <Route element={<ProtectedRoute route={ROUTES.settings} />}><Route path="/settings" element={<Settings />} /></Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
