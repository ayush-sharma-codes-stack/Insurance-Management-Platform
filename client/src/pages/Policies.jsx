import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, RefreshCw, XCircle, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const createPolicySchema = z.object({
  customerId: z.string().min(1, 'Customer selection is required'),
  policyType: z.string().min(2, 'Policy type is required'),
  premiumAmount: z.preprocess((val) => Number(val), z.number().positive('Must be positive')),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

export default function Policies() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'AGENT';

  const [policies, setPolicies] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [renewMonths, setRenewMonths] = useState(12);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createPolicySchema),
  });

  useEffect(() => {
    fetchPolicies(1, search, statusFilter);
    if (isStaff) {
      fetchCustomerDropdown();
    }
  }, [statusFilter]);

  const fetchCustomerDropdown = async () => {
    try {
      const res = await api.get('/customers?limit=100');
      setCustomersList(res.data.data.items);
    } catch (err) {
      console.error('Failed to fetch customers dropdown', err);
    }
  };

  const fetchPolicies = async (page = 1, searchQuery = search, status = statusFilter) => {
    try {
      setLoading(true);
      let url = `/policies?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`;
      if (status) url += `&status=${status}`;
      const res = await api.get(url);
      setPolicies(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val) => {
    setSearch(val);
    fetchPolicies(1, val, statusFilter);
  };

  const handleCreateSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        agentId: user.id, // Current logged-in agent/admin
      };
      await api.post('/policies', payload);
      toast.success('Policy issued successfully');
      setIsCreateOpen(false);
      reset();
      fetchPolicies(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue policy');
    }
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/policies/${selectedPolicy.id}/renew`, { extensionMonths: Number(renewMonths) });
      toast.success('Policy renewed successfully');
      setIsRenewOpen(false);
      fetchPolicies(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to renew policy');
    }
  };

  const handleCancelPolicy = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this policy?')) return;
    try {
      await api.put(`/policies/${id}/cancel`);
      toast.success('Policy cancelled');
      fetchPolicies(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel policy');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg text-xs border border-emerald-500/20">ACTIVE</span>;
      case 'EXPIRED':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 font-bold rounded-lg text-xs border border-amber-500/20">EXPIRED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 font-bold rounded-lg text-xs border border-rose-500/20">CANCELLED</span>;
      default:
        return status;
    }
  };

  const columns = [
    {
      header: 'Policy Number',
      accessorKey: 'policyNumber',
      render: (row) => (
        <div>
          <div className="font-bold text-white font-mono">{row.policyNumber}</div>
          <div className="text-[11px] text-slate-400">{row.policyType}</div>
        </div>
      ),
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-200">{row.customer?.name}</div>
          <div className="text-[11px] text-slate-400">{row.customer?.email}</div>
        </div>
      ),
    },
    {
      header: 'Premium Amount',
      accessorKey: 'premiumAmount',
      render: (row) => `$${row.premiumAmount.toFixed(2)}`,
    },
    {
      header: 'Coverage Period',
      render: (row) => (
        <div className="text-xs">
          <div>{new Date(row.startDate).toLocaleDateString()}</div>
          <div className="text-slate-500">to {new Date(row.endDate).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {isStaff && row.status !== 'CANCELLED' && (
            <>
              <button
                onClick={() => {
                  setSelectedPolicy(row);
                  setIsRenewOpen(true);
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition"
                title="Renew Policy"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCancelPolicy(row.id)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition"
                title="Cancel Policy"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Policy Portfolio</h2>
          <p className="text-xs text-slate-400 mt-1">Active, expired, and cancelled insurance contracts</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {isStaff && (
            <button
              onClick={() => {
                reset();
                setIsCreateOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              Issue New Policy
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={policies}
        pagination={pagination}
        onPageChange={(page) => fetchPolicies(page)}
        onSearch={handleSearch}
        searchValue={search}
        loading={loading}
      />

      {/* Create Policy Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Issue New Insurance Policy">
        <form onSubmit={handleSubmit(handleCreateSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Customer</label>
            <select
              {...register('customerId')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Customer --</option>
              {customersList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
            {errors.customerId && <p className="text-red-400 text-xs mt-1">{errors.customerId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Policy Type</label>
              <select
                {...register('policyType')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Health Insurance">Health Insurance</option>
                <option value="Life Insurance">Life Insurance</option>
                <option value="Auto Insurance">Auto Insurance</option>
                <option value="Home Insurance">Home Insurance</option>
                <option value="Property Insurance">Property Insurance</option>
              </select>
              {errors.policyType && <p className="text-red-400 text-xs mt-1">{errors.policyType.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Premium Amount ($)</label>
              <input
                type="number"
                step="0.01"
                {...register('premiumAmount')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1200.00"
              />
              {errors.premiumAmount && <p className="text-red-400 text-xs mt-1">{errors.premiumAmount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Start Date</label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">End Date</label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Issue Policy'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Renew Policy Modal */}
      <Modal isOpen={isRenewOpen} onClose={() => setIsRenewOpen(false)} title={`Renew Policy ${selectedPolicy?.policyNumber}`}>
        <form onSubmit={handleRenewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Extension Duration (Months)</label>
            <select
              value={renewMonths}
              onChange={(e) => setRenewMonths(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={6}>6 Months</option>
              <option value={12}>12 Months (1 Year)</option>
              <option value={24}>24 Months (2 Years)</option>
            </select>
          </div>

          <p className="text-xs text-slate-400">
            Renewing will extend the policy end date and automatically generate a new pending premium invoice of ${selectedPolicy?.premiumAmount}.
          </p>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsRenewOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
            >
              Confirm Renewal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
