import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import logo from '../../assets/logo.svg';

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  CogIcon,
  ClipboardDocumentIcon,
  TruckIcon,
  ClockIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";

const DashboardLayout = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };
  
  // Map the icon names to Heroicons
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'fas fa-tachometer-alt': return <ChartBarIcon className="h-5 w-5" />;
      case 'fas fa-users': return <UsersIcon className="h-5 w-5" />;
      case 'fas fa-utensils': return <BuildingStorefrontIcon className="h-5 w-5" />;
      case 'fas fa-shopping-cart': return <ShoppingCartIcon className="h-5 w-5" />;
      case 'fas fa-cog': return <CogIcon className="h-5 w-5" />;
      case 'fas fa-store': return <BuildingStorefrontIcon className="h-5 w-5" />;
      case 'fas fa-shopping-bag': return <ShoppingBagIcon className="h-5 w-5" />;
      case 'fas fa-user': return <UserIcon className="h-5 w-5" />;
      case 'fas fa-motorcycle': return <TruckIcon className="h-5 w-5" />;
      case 'fas fa-history': return <ClockIcon className="h-5 w-5" />;
      case 'fas fa-toggle-on': return <CogIcon className="h-5 w-5" />;
      case 'fas fa-dollar-sign': return <CurrencyDollarIcon className="h-5 w-5" />;
      case 'fas fa-receipt': return <ClipboardDocumentIcon className="h-5 w-5" />;
      default: return <div className="h-5 w-5" />;
    }
  };
  
  // Admin navigation items
  const adminNavItems = [
    { title: 'Dashboard', path: '/dashboard', icon: 'fas fa-tachometer-alt' },
    { title: 'Users', path: '/admin/users', icon: 'fas fa-users' },
    { title: 'Restaurants', path: '/admin/restaurants', icon: 'fas fa-utensils' },
    { title: 'Orders', path: '/admin/orders', icon: 'fas fa-shopping-cart' },
    { title: 'Settings', path: '/admin/settings', icon: 'fas fa-cog' },
  ];
  
  // Restaurant admin navigation items
  const restaurantAdminNavItems = [
    { title: 'Dashboard', path: '/restaurant-admin/dashboard', icon: 'fas fa-tachometer-alt' },
    { title: 'My Restaurants', path: '/restaurant-admin/restaurants', icon: 'fas fa-store' },
    { title: 'Restaurant Orders', path: '/restaurant-admin/orders', icon: 'fas fa-shopping-bag' },
    { title: 'Profile', path: '/profile', icon: 'fas fa-user' },
  ];
  
  // Customer navigation items
  const customerNavItems = [
    { title: 'Restaurants', path: '/restaurants', icon: 'fas fa-utensils' },
    { title: 'Cart', path: '/customer/cart', icon: 'fas fa-shopping-cart' },
    { title: 'Orders', path: '/customer/orders', icon: 'fas fa-receipt' },
    { title: 'Profile', path: '/profile', icon: 'fas fa-user' },
  ];
  
  // Delivery personnel navigation items
  const deliveryPersonNavItems = [
    { title: 'Dashboard', path: '/delivery/dashboard', icon: 'fas fa-tachometer-alt' },
    { title: 'Active Deliveries', path: '/delivery/active', icon: 'fas fa-motorcycle' },
    { title: 'Delivery History', path: '/delivery/history', icon: 'fas fa-history' },
    { title: 'Availability', path: '/delivery/availability', icon: 'fas fa-toggle-on' },
    { title: 'Earnings', path: '/delivery/earnings', icon: 'fas fa-dollar-sign' },
    { title: 'Profile', path: '/profile', icon: 'fas fa-user' },
  ];
  
  // Determine which nav items to show based on user role
  let navItems = customerNavItems;
  if (user?.role === 'admin') {
    navItems = adminNavItems;
  } else if (user?.role === 'restaurant-admin') {
    navItems = restaurantAdminNavItems;
  } else if (user?.role === 'delivery-person') {
    navItems = deliveryPersonNavItems;
  }

  // Render nav items with cart badge
  const renderNavItem = (item) => {
    const isCartItem = item.path === '/customer/cart';
    
    return (
      <Link
        key={item.title}
        to={item.path}
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
          isActive(item.path)
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <span className="text-muted-foreground/70">
          {getIcon(item.icon)}
        </span>
        <span>{item.title}</span>
        {isCartItem && cartItemCount > 0 && (
          <Badge variant="destructive" className="ml-auto flex h-5 w-5 items-center justify-center rounded-full p-0">
            {cartItemCount}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Mobile navigation drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="flex h-16 items-center border-b px-4">
            <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
              <img src={logo} alt="Food Delivery" className="h-8 w-auto" />
              <span className="font-semibold">
                {user?.role === 'admin' 
                  ? 'Admin Panel' 
                  : user?.role === 'restaurant-admin'
                    ? 'Restaurant Dashboard'
                    : user?.role === 'delivery-person'
                      ? 'Delivery Dashboard'
                      : 'Food Delivery'
                }
              </span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto" 
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <nav className="grid gap-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-muted-foreground/70">
                  {getIcon(item.icon)}
                </span>
                <span>{item.title}</span>
                {item.path === '/customer/cart' && cartItemCount > 0 && (
                  <Badge variant="destructive" className="ml-auto flex h-5 w-5 items-center justify-center rounded-full p-0">
                    {cartItemCount}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-auto p-4">
            <Separator className="mb-4" />
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || 'User'}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto" 
                onClick={handleLogout}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            <Link to="/" className="hidden items-center gap-2 lg:flex">
              <img src={logo} alt="Food Delivery" className="h-8 w-auto" />
              <span className="font-semibold">
                {user?.role === 'admin' 
                  ? 'Admin Panel' 
                  : user?.role === 'restaurant-admin'
                    ? 'Restaurant Dashboard'
                    : user?.role === 'delivery-person'
                      ? 'Delivery Dashboard'
                      : 'Food Delivery'
                }
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Cart Icon with Badge */}
            {user?.role !== 'admin' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link 
                      to="/customer/cart" 
                      className="relative inline-flex items-center justify-center rounded-md p-2"
                    >
                      <ShoppingCartIcon className="h-5 w-5" />
                      {cartItemCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0"
                        >
                          {cartItemCount}
                        </Badge>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Cart</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* User Dropdown */}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {user?.role || 'User'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <CogIcon className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for desktop */}
        <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
          <div className="flex h-full flex-col">
            <nav className="grid gap-1 p-4">
              {navItems.map(renderNavItem)}
            </nav>
            <div className="mt-auto p-4">
              <Separator className="mb-4" />
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role || 'User'}</p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="ml-auto" 
                        onClick={handleLogout}
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Logout</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 