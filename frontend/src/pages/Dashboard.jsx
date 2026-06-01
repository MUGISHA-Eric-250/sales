import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Dashboard() {
  const [stats, setStats] = useState({ customers: 0, products: 0, sales: 0, revenue: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/customers'),
      api.get('/products'),
      api.get('/sales'),
    ]).then(([cRes, pRes, sRes]) => {
      const sales = sRes.data;
      setStats({
        customers: cRes.data.length,
        products: pRes.data.length,
        sales: sales.length,
        revenue: sales.reduce((sum, s) => sum + Number(s.totalAmountPaid), 0),
      });
    }).catch(console.error);
  }, []);

  const cards = [
    { label: 'Total Customers', value: stats.customers, color: 'bg-blue-500' },
    { label: 'Total Products', value: stats.products, color: 'bg-green-500' },
    { label: 'Total Sales', value: stats.sales, color: 'bg-orange-500' },
    { label: 'Total Revenue', value: `$${stats.revenue.toFixed(2)}`, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map(card => (
          <div key={card.label} className={`${card.color} text-white p-6 rounded-lg shadow-lg`}>
            <p className="text-lg opacity-90">{card.label}</p>
            <p className="text-3xl font-bold mt-2">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
