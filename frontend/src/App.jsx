import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { MainLayout, DashboardLayout } from './components/Layout';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminUserView from './pages/Admin/AdminUserView';
import AdminUserEdit from './pages/Admin/AdminUserEdit';
import AdminRestaurantList from './pages/Admin/AdminRestaurantList';
import AdminRestaurantCreate from './pages/Admin/AdminRestaurantCreate';
import AdminRestaurantEdit from './pages/Admin/AdminRestaurantEdit';
import AdminMenuItemCreate from './pages/Admin/AdminMenuItemCreate';
import AdminMenuItemEdit from './pages/Admin/AdminMenuItemEdit';
import AdminRestaurantView from './pages/Admin/AdminRestaurantView';
import AdminRestaurantStats from './pages/Admin/AdminRestaurantStats';
import RestaurantAdminDashboard from './pages/RestaurantAdmin/RestaurantAdminDashboard';
import RestaurantAdminCreate from './pages/RestaurantAdmin/RestaurantAdminCreate';
import RestaurantAdminView from './pages/RestaurantAdmin/RestaurantAdminView';
import RestaurantAdminEdit from './pages/RestaurantAdmin/RestaurantAdminEdit';
import RestaurantAdminMenu from './pages/RestaurantAdmin/RestaurantAdminMenu';
import RestaurantAdminMenuItemCreate from './pages/RestaurantAdmin/RestaurantAdminMenuItemCreate';
import RestaurantAdminMenuItemEdit from './pages/RestaurantAdmin/RestaurantAdminMenuItemEdit';
import RestaurantAdminOrders from './pages/RestaurantAdmin/RestaurantAdminOrders';
import CustomerHome from './pages/CustomerHome';
import RestaurantDetails from './pages/RestaurantDetails';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
// Delivery Personnel pages
import DeliveryDashboard from './pages/Delivery/DeliveryDashboard';
import ActiveDeliveries from './pages/Delivery/ActiveDeliveries';
import './App.css'
import { CartProvider } from './context/CartContext';
import { AlertProvider } from './context/AlertContext';

function App() {
  const { isAuthenticated, loading, user } = useAuth();

  // Check if user is admin
  const isAdmin = user && user.role === 'admin';

  // Check if user is restaurant admin
  const isRestaurantAdmin = user && user.role === 'restaurant-admin';

  // Check if user is delivery personnel
  const isDeliveryPerson = user && user.role === 'delivery-person';

  // Check if user is regular customer
  const isCustomer = user && user.role === 'customer';

  if (loading) {
  return (
      <div style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <div style={{ 
          height: '2.5rem', 
          width: '2.5rem', 
          animation: 'spin 1s linear infinite',
          borderRadius: '9999px',
          borderWidth: '4px',
          borderColor: '#6366f1',
          borderTopColor: 'transparent'
        }}></div>
      </div>
    );
  }

  // Helper function to wrap dashboard routes with DashboardLayout
  const withDashboardLayout = (Component) => (
    isAuthenticated ? <DashboardLayout><Component /></DashboardLayout> : <Navigate to="/login" />
  );

  // Helper function to wrap public routes with MainLayout
  const withMainLayout = (Component) => (
    <MainLayout><Component /></MainLayout>
  );

  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* Public routes with MainLayout */}
          <Route path="/login" element={!isAuthenticated ? <LoginForm /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!isAuthenticated ? <RegisterForm /> : <Navigate to="/dashboard" />} />
          
          {/* Dashboard route - redirect based on user role */}
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated 
                ? isAdmin
                  ? withDashboardLayout(Dashboard)
                  : isRestaurantAdmin
                    ? <Navigate to="/restaurant-admin/dashboard" />
                    : isDeliveryPerson
                      ? <Navigate to="/delivery/dashboard" />
                      : <Navigate to="/customer/home" />
                : <Navigate to="/login" />
            } 
          />
          
          {/* Delivery Person routes */}
          <Route 
            path="/delivery/dashboard" 
            element={
              isAuthenticated 
                ? isDeliveryPerson
                  ? withDashboardLayout(DeliveryDashboard)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/delivery/active" 
            element={
              isAuthenticated 
                ? isDeliveryPerson
                  ? withDashboardLayout(ActiveDeliveries)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          
          {/* Customer routes */}
          <Route 
            path="/customer/home" 
            element={
              isAuthenticated 
                ? isCustomer
                  ? withDashboardLayout(CustomerHome)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/restaurants/:id" 
            element={
              isAuthenticated 
                ? withDashboardLayout(RestaurantDetails)
                : <Navigate to="/login" />
            } 
          />
          
          {/* Cart and Orders routes */}
          <Route 
            path="/customer/cart" 
            element={
              isAuthenticated 
                ? withDashboardLayout(CartPage)
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/customer/orders" 
            element={
              isAuthenticated 
                ? withDashboardLayout(OrdersPage)
                : <Navigate to="/login" />
            } 
          />
          
          {/* Profile route with appropriate layout based on user role */}
          <Route 
            path="/profile" 
            element={
              isAuthenticated 
                ? withDashboardLayout(Profile)
                : <Navigate to="/login" />
            } 
          />
          
          {/* Admin routes with DashboardLayout */}
          <Route 
            path="/admin/users" 
            element={
              isAuthenticated 
                ? isAdmin 
                  ? withDashboardLayout(AdminUsers)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/admin/users/view" 
            element={
              isAuthenticated 
                ? isAdmin 
                  ? withDashboardLayout(AdminUserView) 
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          
          <Route
            path="/admin/users/edit" 
            element={
              isAuthenticated 
                ? isAdmin 
                  ? withDashboardLayout(AdminUserEdit)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          
          {/* Admin Restaurant routes with DashboardLayout */}
          <Route 
            path="/admin/restaurants" 
            element={
              isAuthenticated 
                ? isAdmin 
                  ? withDashboardLayout(AdminRestaurantList)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/admin/restaurants/create" 
            element={
              isAuthenticated 
                ? isAdmin 
                  ? withDashboardLayout(AdminRestaurantCreate)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/admin/restaurants/:id" 
            element={
              isAuthenticated 
                ? isAdmin 
                  ? withDashboardLayout(AdminRestaurantView)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/admin/restaurants/edit/:id" 
            element={
              isAuthenticated 
                ? isAdmin 
                  ? withDashboardLayout(AdminRestaurantEdit)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/admin/restaurants/stats" 
            element={
              isAuthenticated 
                ? isAdmin 
                  ? withDashboardLayout(AdminRestaurantStats)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          
          {/* Admin Menu Item routes with DashboardLayout */}
          <Route 
            path="/admin/restaurants/:restaurantId/menu/create" 
            element={
              isAuthenticated 
                ? isAdmin 
                  ? withDashboardLayout(AdminMenuItemCreate)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/admin/restaurants/:restaurantId/menu/:id/edit" 
            element={
              isAuthenticated 
                ? isAdmin 
                  ? withDashboardLayout(AdminMenuItemEdit)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />

          {/* Restaurant Admin routes with DashboardLayout */}
          <Route 
            path="/restaurant-admin/dashboard" 
            element={
              isAuthenticated 
                ? isRestaurantAdmin 
                  ? withDashboardLayout(RestaurantAdminDashboard)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/restaurant-admin/restaurants/create" 
            element={
              isAuthenticated 
                ? isRestaurantAdmin 
                  ? withDashboardLayout(RestaurantAdminCreate)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/restaurant-admin/restaurants/:id" 
            element={
              isAuthenticated 
                ? isRestaurantAdmin 
                  ? withDashboardLayout(RestaurantAdminView)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/restaurant-admin/restaurants/:id/edit" 
            element={
              isAuthenticated 
                ? isRestaurantAdmin 
                  ? withDashboardLayout(RestaurantAdminEdit)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/restaurant-admin/restaurants/:id/menu" 
            element={
              isAuthenticated 
                ? isRestaurantAdmin 
                  ? withDashboardLayout(RestaurantAdminMenu)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/restaurant-admin/restaurants/:id/orders" 
            element={
              isAuthenticated 
                ? isRestaurantAdmin 
                  ? withDashboardLayout(RestaurantAdminOrders)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          
          {/* Restaurant Admin Menu Item routes with DashboardLayout */}
          <Route 
            path="/restaurant-admin/restaurants/:restaurantId/menu/create" 
            element={
              isAuthenticated 
                ? isRestaurantAdmin 
                  ? withDashboardLayout(RestaurantAdminMenuItemCreate)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/restaurant-admin/restaurants/:restaurantId/menu/:menuItemId/edit" 
            element={
              isAuthenticated 
                ? isRestaurantAdmin 
                  ? withDashboardLayout(RestaurantAdminMenuItemEdit)
                  : <Navigate to="/dashboard" />
                : <Navigate to="/login" />
            } 
          />
          
          {/* Default redirect */}
          <Route path="/" element={isAuthenticated ? 
            (isAdmin ? <Navigate to="/admin/restaurants" /> : 
             isRestaurantAdmin ? <Navigate to="/restaurant-admin/dashboard" /> : 
             <Navigate to="/customer/home" />) : 
            <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
