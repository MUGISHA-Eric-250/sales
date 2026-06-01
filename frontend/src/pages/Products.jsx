import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productCode: '', productName: '', quantitySold: 0, unitPrice: 0 });

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const res = await api.get('/products');
    setProducts(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', form);
      setForm({ productCode: '', productName: '', quantitySold: 0, unitPrice: 0 });
      setShowForm(false);
      loadProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating product');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Add Product
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6 border">
          <h2 className="text-xl font-semibold mb-4">New Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Code</label>
              <input type="text" value={form.productCode} onChange={e => setForm({ ...form, productCode: e.target.value })} required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input type="text" value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity Sold</label>
              <input type="number" value={form.quantitySold} onChange={e => setForm({ ...form, quantitySold: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit Price</label>
              <input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: Number(e.target.value) })} required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Save</button>
            <button type="button" onClick={() => { setShowForm(false); setForm({ productCode: '', productName: '', quantitySold: 0, unitPrice: 0 }); }}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">Product Code</th>
              <th className="p-3 text-left">Product Name</th>
              <th className="p-3 text-right">Qty Sold</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.productCode} className="border-t hover:bg-slate-50">
                <td className="p-3">{p.productCode}</td>
                <td className="p-3">{p.productName}</td>
                <td className="p-3 text-right">{p.quantitySold}</td>
                <td className="p-3 text-right">${Number(p.unitPrice).toFixed(2)}</td>
                <td className="p-3 text-right">${(Number(p.quantitySold) * Number(p.unitPrice)).toFixed(2)}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
