import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', telephone: '', address: '' });

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    const res = await api.get('/customers');
    setCustomers(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/customers', form);
    setForm({ firstName: '', lastName: '', telephone: '', address: '' });
    setShowForm(false);
    loadCustomers();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Add Customer
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6 border">
          <h2 className="text-xl font-semibold mb-4">New Customer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telephone</label>
              <input type="text" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Save</button>
            <button type="button" onClick={() => { setShowForm(false); setForm({ firstName: '', lastName: '', telephone: '', address: '' }); }}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">First Name</th>
              <th className="p-3 text-left">Last Name</th>
              <th className="p-3 text-left">Telephone</th>
              <th className="p-3 text-left">Address</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.customerNumber} className="border-t hover:bg-slate-50">
                <td className="p-3">{c.customerNumber}</td>
                <td className="p-3">{c.firstName}</td>
                <td className="p-3">{c.lastName}</td>
                <td className="p-3">{c.telephone}</td>
                <td className="p-3">{c.address}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
