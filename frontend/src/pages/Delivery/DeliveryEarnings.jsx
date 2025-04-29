import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DeliveryEarnings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedToday: 0,
    totalDeliveries: 0,
    rating: 0
  });
  const [earningsHistory, setEarningsHistory] = useState([]);
  const [filter, setFilter] = useState('week'); // 'day', 'week', 'month', 'year'

  useEffect(() => {
    // Redirect if not a delivery person
    if (user && user.role !== 'delivery-person') {
      navigate('/dashboard');
      return;
    }

    // Fetch delivery person stats
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/assignments/stats');
        setStats(response.data.data);
        
        // Fetch earnings history
        const historyResponse = await api.get('/deliveries/history?limit=50');
        
        // Calculate daily earnings (for chart)
        const deliveries = historyResponse.data.data;
        const dailyEarnings = calculateDailyEarnings(deliveries);
        setEarningsHistory(dailyEarnings);
        
      } catch (err) {
        console.error('Error fetching delivery earnings:', err);
        setError('Failed to load earnings data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  // Helper to format earnings by day for the chart
  const calculateDailyEarnings = (deliveries) => {
    const earningsByDay = {};
    
    deliveries.forEach(delivery => {
      // Calculate base earnings as $5 + $1 per km (matching backend logic)
      const basePayment = 5;
      const ratePerKm = 1;
      const deliveryEarning = basePayment + (delivery.distance * ratePerKm);
      
      // Get date without time
      const date = new Date(delivery.actualDeliveryTime).toISOString().split('T')[0];
      
      if (!earningsByDay[date]) {
        earningsByDay[date] = 0;
      }
      
      earningsByDay[date] += deliveryEarning;
    });
    
    // Convert to array and sort by date
    const result = Object.entries(earningsByDay).map(([date, amount]) => ({
      date,
      amount
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    return result;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getFilteredEarnings = () => {
    const now = new Date();
    const filtered = earningsHistory.filter(earning => {
      const earningDate = new Date(earning.date);
      
      if (filter === 'day') {
        return earningDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];
      } else if (filter === 'week') {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return earningDate >= oneWeekAgo;
      } else if (filter === 'month') {
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return earningDate >= oneMonthAgo;
      } else if (filter === 'year') {
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return earningDate >= oneYearAgo;
      }
      
      return true;
    });
    
    return filtered;
  };

  const calculateTotalForFilter = () => {
    const filtered = getFilteredEarnings();
    return filtered.reduce((total, earning) => total + earning.amount, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Earnings</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Earnings */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-50 text-yellow-500">
              <i className="fas fa-dollar-sign text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-800">{formatCurrency(stats.totalEarnings)}</p>
            </div>
          </div>
        </div>
        
        {/* Completed Today */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50 text-green-500">
              <i className="fas fa-check-circle text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Completed Today</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.completedToday} deliveries</p>
            </div>
          </div>
        </div>
        
        {/* Total Deliveries */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-50 text-blue-500">
              <i className="fas fa-motorcycle text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Total Deliveries</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalDeliveries}</p>
            </div>
          </div>
        </div>
        
        {/* Rating */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-50 text-purple-500">
              <i className="fas fa-star text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Average Rating</p>
              <p className="text-2xl font-semibold text-gray-800">
                {stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A'}
                <span className="text-sm text-gray-500 ml-1">/ 5.0</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Earnings Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Earnings History</h2>
          
          <div className="mt-4 md:mt-0">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border ${filter === 'day' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} border-gray-200 rounded-l-lg`}
                onClick={() => setFilter('day')}
              >
                Today
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border ${filter === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} border-gray-200`}
                onClick={() => setFilter('week')}
              >
                Week
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border ${filter === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} border-gray-200`}
                onClick={() => setFilter('month')}
              >
                Month
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border ${filter === 'year' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} border-gray-200 rounded-r-lg`}
                onClick={() => setFilter('year')}
              >
                Year
              </button>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-500 text-sm">
            {filter === 'day' ? 'Today\'s' : filter === 'week' ? 'This Week\'s' : filter === 'month' ? 'This Month\'s' : 'This Year\'s'} Earnings:
            <span className="ml-2 text-xl font-semibold text-gray-800">{formatCurrency(calculateTotalForFilter())}</span>
          </p>
        </div>
        
        {/* Simple Bar Chart - in a real app, you would use a proper chart library */}
        <div className="h-64 mt-6">
          {getFilteredEarnings().length > 0 ? (
            <div className="flex h-full items-end space-x-2">
              {getFilteredEarnings().map((earning, index) => {
                const maxHeight = Math.max(...getFilteredEarnings().map(e => e.amount));
                const height = (earning.amount / maxHeight) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${height}%`, minHeight: '10px' }}
                    ></div>
                    <p className="text-xs mt-1 text-gray-500">{new Date(earning.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No earnings data available for the selected period</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Payment Info */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Information</h2>
        
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="font-medium text-gray-700 mb-2">How Earnings Are Calculated</h3>
          <ul className="list-disc pl-5 text-gray-600">
            <li>Base payment: $5.00 per delivery</li>
            <li>Distance payment: $1.00 per kilometer</li>
            <li>Tips from customers (100% goes to you)</li>
            <li>Bonus for peak hours (varies)</li>
          </ul>
        </div>
        
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="font-medium text-gray-700 mb-2">Payment Schedule</h3>
          <p className="text-gray-600">Payments are processed weekly on Mondays for the previous week's deliveries.</p>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Need Help?</h3>
          <p className="text-gray-600">
            If you have any questions regarding your earnings, please contact our support team:
            <a href="mailto:support@fooddelivery.com" className="text-blue-600 hover:text-blue-800 ml-1">support@fooddelivery.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryEarnings; 