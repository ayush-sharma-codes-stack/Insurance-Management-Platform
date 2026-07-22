import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { CreditCard, Download, AlertOctagon, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Premiums() {
  const [premiums, setPremiums] = useState([]);
  const [overduePremiums, setOverduePremiums] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Pay Now Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPremium, setSelectedPremium] = useState(null);
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  useEffect(() => {
    fetchPremiums(1, search, paymentStatusFilter);
    fetchOverduePremiums();
  }, [paymentStatusFilter]);

  const fetchOverduePremiums = async () => {
    try {
      const res = await api.get('/premiums/overdue');
      setOverduePremiums(res.data.data);
    } catch (err) {
      console.error('Failed to fetch overdue premiums', err);
    }
  };

  const fetchPremiums = async (page = 1, searchQuery = search, status = paymentStatusFilter) => {
    try {
      setLoading(true);
      let url = `/premiums?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`;
      if (status) url += `&paymentStatus=${status}`;
      const res = await api.get(url);
      setPremiums(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to fetch premiums');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val) => {
    setSearch(val);
    fetchPremiums(1, val, paymentStatusFilter);
  };

  const handleOpenPayModal = (premium) => {
    setSelectedPremium(premium);
    setIsPayModalOpen(true);
  };

  const handleExecutePayment = async () => {
    setIsProcessingPay(true);
    try {
      await api.put(`/premiums/${selectedPremium.id}/pay`, {
        paymentMethod: 'CREDIT_CARD',
        transactionId: `TXN-${Date.now()}`,
      });
      toast.success('Payment recorded successfully!');
      setIsPayModalOpen(false);
      fetchPremiums(pagination.currentPage);
      fetchOverduePremiums();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setIsProcessingPay(false);
    }
  };

  const handleDownloadReceipt = async (premiumId) => {
    try {
      const response = await api.get(`/premiums/${premiumId}/receipt`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${premiumId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Receipt downloaded successfully');
    } catch (err) {
      toast.error('Failed to download receipt');
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg text-xs border border-emerald-500/20">PAID</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 font-bold rounded-lg text-xs border border-amber-500/20">PENDING</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 font-bold rounded-lg text-xs border border-rose-500/20">OVERDUE</span>;
      default:
        return status;
    }
  };

  const columns = [
    {
      header: 'Policy Number',
      render: (row) => (
        <div>
          <div className="font-bold text-white font-mono">{row.policy?.policyNumber}</div>
          <div className="text-[11px] text-slate-400">{row.policy?.customer?.name}</div>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      render: (row) => `$${row.amount.toFixed(2)}`,
    },
    {
      header: 'Due Date',
      accessorKey: 'dueDate',
      render: (row) => new Date(row.dueDate).toLocaleDateString(),
    },
    {
      header: 'Payment Date',
      accessorKey: 'paymentDate',
      render: (row) => (row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : '—'),
    },
    {
      header: 'Status',
      render: (row) => getPaymentStatusBadge(row.paymentStatus),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {row.paymentStatus !== 'PAID' ? (
            <button
              onClick={() => handleOpenPayModal(row)}
              className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              Pay Now
            </button>
          ) : (
            <button
              onClick={() => handleDownloadReceipt(row.id)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              Receipt
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overdue Alert Dashboard Widget */}
      {overduePremiums.length > 0 && (
        <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between gap-4 text-rose-300">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-6 h-6 flex-shrink-0 text-rose-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Overdue Premiums Alert</h4>
              <p className="text-xs text-rose-300/80 mt-0.5">
                You have <span className="font-bold underline">{overduePremiums.length}</span> overdue premium payment(s) requiring immediate settlement.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Premium Payments</h2>
          <p className="text-xs text-slate-400 mt-1">Track upcoming, paid, and overdue premium invoices</p>
        </div>

        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="OVERDUE">OVERDUE</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={premiums}
        pagination={pagination}
        onPageChange={(page) => fetchPremiums(page)}
        onSearch={handleSearch}
        searchValue={search}
        loading={loading}
      />

      {/* Pay Now Mock Flow Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Mock Payment Checkout">
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">Policy Number</span>
              <span className="text-sm font-bold text-white font-mono">{selectedPremium?.policy?.policyNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-semibold">Amount Due</span>
              <span className="text-xl font-extrabold text-emerald-400">${selectedPremium?.amount.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Select Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900 border border-blue-500/50 rounded-xl flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                <CreditCard className="w-4 h-4 text-blue-400" /> Credit / Debit Card
              </div>
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-not-allowed">
                Bank Transfer (ACH)
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleExecutePayment}
              disabled={isProcessingPay}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessingPay ? 'Processing...' : 'Complete Payment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
