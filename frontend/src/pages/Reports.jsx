import { useState } from 'react';
import api from '../api/axios';

const TABS = [
  { key: 'customers', label: 'Customers', color: 'bg-blue-500' },
  { key: 'products', label: 'Products', color: 'bg-green-500' },
  { key: 'sales', label: 'Sales', color: 'bg-purple-500' },
];

const PERIODS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('customers');
  const [activePeriod, setActivePeriod] = useState('daily');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (tab, period) => {
    setLoading(true);
    try {
      const res = await api.get(`/report/${tab}?period=${period}`);
      setData(res.data);
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchReport('customers', 'daily');
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchReport(tab, activePeriod);
  };

  const handlePeriodChange = (period) => {
    setActivePeriod(period);
    fetchReport(activeTab, period);
  };

  const renderTable = () => {
    if (loading) return <p className="text-center py-8 text-gray-500">Loading...</p>;
    if (data.length === 0) return <p className="text-center py-8 text-gray-500">No data found for this period</p>;

    if (activeTab === 'customers') {
      return (
        <table className="w-full">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">First Name</th>
              <th className="p-3 text-left">Last Name</th>
              <th className="p-3 text-left">Telephone</th>
              <th className="p-3 text-left">Address</th>
              <th className="p-3 text-left">Registered</th>
            </tr>
          </thead>
          <tbody>
            {data.map(c => (
              <tr key={c.customerNumber} className="border-t hover:bg-slate-50">
                <td className="p-3">{c.customerNumber}</td>
                <td className="p-3">{c.firstName}</td>
                <td className="p-3">{c.lastName}</td>
                <td className="p-3">{c.telephone}</td>
                <td className="p-3">{c.address}</td>
                <td className="p-3">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'products') {
      return (
        <table className="w-full">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-right">Qty Sold</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-left">Added</th>
            </tr>
          </thead>
          <tbody>
            {data.map(p => (
              <tr key={p.productCode} className="border-t hover:bg-slate-50">
                <td className="p-3">{p.productCode}</td>
                <td className="p-3">{p.productName}</td>
                <td className="p-3 text-right">{p.quantitySold}</td>
                <td className="p-3 text-right">${Number(p.unitPrice).toFixed(2)}</td>
                <td className="p-3 text-right">${(Number(p.quantitySold) * Number(p.unitPrice)).toFixed(2)}</td>
                <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <table className="w-full">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="p-3 text-left">Invoice #</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Payment Method</th>
            <th className="p-3 text-right">Total Paid</th>
          </tr>
        </thead>
        <tbody>
          {data.map(s => (
            <tr key={s.invoiceNumber} className="border-t hover:bg-slate-50">
              <td className="p-3">{s.invoiceNumber}</td>
              <td className="p-3">{new Date(s.salesDate).toLocaleString()}</td>
              <td className="p-3">{s.paymentMethod}</td>
              <td className="p-3 text-right">${Number(s.totalAmountPaid).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const totals = () => {
    if (activeTab === 'customers') return `${data.length} customers`;
    if (activeTab === 'products') {
      const totalQty = data.reduce((s, p) => s + Number(p.quantitySold), 0);
      const totalVal = data.reduce((s, p) => s + Number(p.quantitySold) * Number(p.unitPrice), 0);
      return `${data.length} products | ${totalQty} units | $${totalVal.toFixed(2)}`;
    }
    const totalAmt = data.reduce((s, sale) => s + Number(sale.totalAmountPaid), 0);
    return `${data.length} sales | $${totalAmt.toFixed(2)} total`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 rounded-lg text-white transition ${activeTab === tab.key ? tab.color : 'bg-gray-400'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {PERIODS.map(period => (
            <button key={period.key} onClick={() => handlePeriodChange(period.key)}
              className={`px-4 py-2 rounded-lg transition border ${activePeriod === period.key ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'}`}>
              {period.label}
            </button>
          ))}
        </div>

        <div className="mb-4 text-sm font-semibold text-gray-600">{totals()}</div>

        <div className="overflow-x-auto">{renderTable()}</div>
      </div>
    </div>
  );
}
