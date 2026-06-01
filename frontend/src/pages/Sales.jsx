import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ salesDate: '', paymentMethod: '', totalAmountPaid: '' });
  const [error, setError] = useState('');

  useEffect(() => { loadSales(); }, []);

  const loadSales = async () => {
    const res = await api.get('/sales');
    setSales(res.data);
  };

  const resetForm = () => {
    setForm({ salesDate: '', paymentMethod: '', totalAmountPaid: '' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form };
      if (payload.salesDate) {
        payload.salesDate = new Date(payload.salesDate).toISOString();
      }
      if (editing) {
        await api.put(`/sales/${editing}`, payload);
      } else {
        await api.post('/sales', payload);
      }
      resetForm();
      loadSales();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving sale');
    }
  };

  const handleEdit = (sale) => {
    setForm({
      salesDate: sale.salesDate ? new Date(sale.salesDate).toISOString().slice(0, 16) : '',
      paymentMethod: sale.paymentMethod || '',
      totalAmountPaid: sale.totalAmountPaid,
    });
    setEditing(sale.invoiceNumber);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this sale?')) {
      await api.delete(`/sales/${id}`);
      loadSales();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Sales</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + New Sale
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6 border">
          <h2 className="text-xl font-semibold mb-4">{editing ? 'Edit Sale' : 'New Sale'}</h2>
          {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sales Date</label>
              <input type="datetime-local" value={form.salesDate} onChange={e => setForm({ ...form, salesDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select...</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Amount Paid</label>
              <input type="number" step="0.01" value={form.totalAmountPaid} onChange={e => setForm({ ...form, totalAmountPaid: e.target.value })} required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              {editing ? 'Update' : 'Create Sale'}
            </button>
            <button type="button" onClick={resetForm}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">Invoice #</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Payment Method</th>
              <th className="p-3 text-right">Total Paid</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.invoiceNumber} className="border-t hover:bg-slate-50">
                <td className="p-3">{sale.invoiceNumber}</td>
                <td className="p-3">{new Date(sale.salesDate).toLocaleString()}</td>
                <td className="p-3">{sale.paymentMethod}</td>
                <td className="p-3 text-right">${Number(sale.totalAmountPaid).toFixed(2)}</td>
                <td className="p-3 text-center">
                  <button onClick={() => handleEdit(sale)} className="text-blue-600 hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(sale.invoiceNumber)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No sales found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
