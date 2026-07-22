import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, CheckCircle, XCircle, FileText, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const submitClaimSchema = z.object({
  policyId: z.string().min(1, 'Please select a policy'),
  claimAmount: z.preprocess((val) => Number(val), z.number().positive('Claim amount must be positive')),
  reason: z.string().min(5, 'Please provide a detailed reason for the claim'),
});

export default function Claims() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'AGENT';

  const [claims, setClaims] = useState([]);
  const [activePolicies, setActivePolicies] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(submitClaimSchema),
  });

  useEffect(() => {
    fetchClaims(1, search, statusFilter);
    fetchActivePolicies();
  }, [statusFilter]);

  const fetchActivePolicies = async () => {
    try {
      const res = await api.get('/policies?status=ACTIVE&limit=100');
      setActivePolicies(res.data.data.items);
    } catch (err) {
      console.error('Failed to fetch active policies', err);
    }
  };

  const fetchClaims = async (page = 1, searchQuery = search, status = statusFilter) => {
    try {
      setLoading(true);
      let url = `/claims?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`;
      if (status) url += `&status=${status}`;
      const res = await api.get(url);
      setClaims(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val) => {
    setSearch(val);
    fetchClaims(1, val, statusFilter);
  };

  const handleClaimSubmit = async (data) => {
    try {
      await api.post('/claims', data);
      toast.success('Claim submitted successfully!');
      setIsSubmitOpen(false);
      reset();
      fetchClaims(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit claim');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewNotes) {
      toast.error('Review notes are required');
      return;
    }
    try {
      await api.put(`/claims/${selectedClaim.id}/review`, {
        status: reviewAction,
        reviewNotes,
      });
      toast.success(`Claim successfully marked as ${reviewAction}`);
      setIsReviewOpen(false);
      setReviewNotes('');
      fetchClaims(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update claim status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg text-xs border border-emerald-500/20">APPROVED</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 font-bold rounded-lg text-xs border border-amber-500/20">PENDING</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 font-bold rounded-lg text-xs border border-rose-500/20">REJECTED</span>;
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
      header: 'Claim Amount',
      accessorKey: 'claimAmount',
      render: (row) => `$${row.claimAmount.toFixed(2)}`,
    },
    {
      header: 'Reason',
      accessorKey: 'reason',
      render: (row) => <span className="line-clamp-1 max-w-xs">{row.reason}</span>,
    },
    {
      header: 'Submission Date',
      accessorKey: 'submissionDate',
      render: (row) => new Date(row.submissionDate).toLocaleDateString(),
    },
    {
      header: 'Status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {isStaff && row.status === 'PENDING' && (
            <button
              onClick={() => {
                setSelectedClaim(row);
                setReviewAction('APPROVED');
                setIsReviewOpen(true);
              }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-semibold transition"
            >
              Review
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Claims Management</h2>
          <p className="text-xs text-slate-400 mt-1">File and evaluate insurance claim requests</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <button
            onClick={() => {
              reset();
              setIsSubmitOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            File New Claim
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={claims}
        pagination={pagination}
        onPageChange={(page) => fetchClaims(page)}
        onSearch={handleSearch}
        searchValue={search}
        loading={loading}
      />

      {/* Submit Claim Modal */}
      <Modal isOpen={isSubmitOpen} onClose={() => setIsSubmitOpen(false)} title="File Insurance Claim">
        <form onSubmit={handleSubmit(handleClaimSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Active Policy</label>
            <select
              {...register('policyId')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Active Policy --</option>
              {activePolicies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.policyNumber} ({p.policyType} - {p.customer?.name})
                </option>
              ))}
            </select>
            {errors.policyId && <p className="text-red-400 text-xs mt-1">{errors.policyId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Claim Amount ($)</label>
            <input
              type="number"
              step="0.01"
              {...register('claimAmount')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2500.00"
            />
            {errors.claimAmount && <p className="text-red-400 text-xs mt-1">{errors.claimAmount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Reason & Incident Description</label>
            <textarea
              rows={4}
              {...register('reason')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what occurred, dates, and loss details..."
            ></textarea>
            {errors.reason && <p className="text-red-400 text-xs mt-1">{errors.reason.message}</p>}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsSubmitOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Claim Modal */}
      <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title="Evaluate Claim Request">
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1.5">
            <div>
              <span className="text-slate-400">Policy:</span>{' '}
              <span className="font-bold text-white">{selectedClaim?.policy?.policyNumber}</span>
            </div>
            <div>
              <span className="text-slate-400">Claim Amount:</span>{' '}
              <span className="font-bold text-emerald-400">${selectedClaim?.claimAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">Reason:</span> <span className="text-slate-200">{selectedClaim?.reason}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReviewAction('APPROVED')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                  reviewAction === 'APPROVED'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <CheckCircle className="w-4 h-4" /> Approve Claim
              </button>

              <button
                type="button"
                onClick={() => setReviewAction('REJECTED')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                  reviewAction === 'REJECTED'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <XCircle className="w-4 h-4" /> Reject Claim
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Review Notes & Justification</label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide verification details or reason for rejection..."
            ></textarea>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsReviewOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
            >
              Submit Decision
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
