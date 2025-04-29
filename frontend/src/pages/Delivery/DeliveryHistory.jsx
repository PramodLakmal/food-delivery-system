import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DeliveryHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  useEffect(() => {
    // Check if user is a delivery person
    if (user && user.role !== 'delivery-person') {
      navigate('/dashboard');
      return;
    }

    // Fetch delivery history
    const fetchDeliveryHistory = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // Mock data for demonstration
        const mockData = [
          {
            id: '1',
            orderId: 'ORD-12345',
            date: new Date(2023, 5, 12, 14, 30),
            restaurantName: 'Burger Palace',
            customerName: 'John Doe',
            amount: 32.50,
            tip: 5.00,
            distance: 3.2,
            deliveryTime: 25, // minutes
            status: 'completed'
          },
          {
            id: '2',
            orderId: 'ORD-12346',
            date: new Date(2023, 5, 12, 18, 15),
            restaurantName: 'Pizza Haven',
            customerName: 'Jane Smith',
            amount: 45.75,
            tip: 7.50,
            distance: 5.7,
            deliveryTime: 35,
            status: 'completed'
          },
          {
            id: '3',
            orderId: 'ORD-12347',
            date: new Date(2023, 5, 11, 12, 45),
            restaurantName: 'Sushi Express',
            customerName: 'Mike Johnson',
            amount: 28.90,
            tip: 4.00,
            distance: 2.8,
            deliveryTime: 22,
            status: 'completed'
          },
          {
            id: '4',
            orderId: 'ORD-12348',
            date: new Date(2023, 5, 10, 19, 20),
            restaurantName: 'Taco Time',
            customerName: 'Sarah Williams',
            amount: 18.25,
            tip: 3.00,
            distance: 1.9,
            deliveryTime: 15,
            status: 'completed'
          },
          {
            id: '5',
            orderId: 'ORD-12349',
            date: new Date(2023, 5, 9, 13, 10),
            restaurantName: 'Chinese Delight',
            customerName: 'Robert Brown',
            amount: 37.80,
            tip: 6.00,
            distance: 4.5,
            deliveryTime: 30,
            status: 'completed'
          }
        ];
        
        setDeliveryHistory(mockData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch delivery history');
        setLoading(false);
      }
    };

    fetchDeliveryHistory();
  }, [user, navigate]);

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const calculateTotalEarnings = () => {
    return deliveryHistory.reduce((total, delivery) => total + delivery.tip, 0).toFixed(2);
  };

  const filterDeliveries = () => {
    if (filter === 'all') return deliveryHistory;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (filter === 'today') {
      return deliveryHistory.filter(delivery => delivery.date >= today);
    }
    
    if (filter === 'week') {
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return deliveryHistory.filter(delivery => delivery.date >= oneWeekAgo);
    }
    
    if (filter === 'month') {
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return deliveryHistory.filter(delivery => delivery.date >= oneMonthAgo);
    }
    
    return deliveryHistory;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  const filteredDeliveries = filterDeliveries();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Delivery History</h1>
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="mb-4 md:mb-0">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'} border-gray-200 rounded-l-lg`}
              onClick={() => setFilter('all')}
            >
              All Time
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border ${filter === 'today' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'} border-gray-200`}
              onClick={() => setFilter('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border ${filter === 'week' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'} border-gray-200`}
              onClick={() => setFilter('week')}
            >
              This Week
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border ${filter === 'month' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'} border-gray-200 rounded-r-lg`}
              onClick={() => setFilter('month')}
            >
              This Month
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Total Tips Earned</p>
          <p className="text-xl font-bold">${calculateTotalEarnings()}</p>
        </div>
      </div>
      
      {filteredDeliveries.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-lg text-gray-500">No delivery history found for the selected period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tip
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {delivery.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(delivery.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {delivery.restaurantName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {delivery.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${delivery.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    ${delivery.tip.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {delivery.distance} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {delivery.deliveryTime} min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeliveryHistory; 