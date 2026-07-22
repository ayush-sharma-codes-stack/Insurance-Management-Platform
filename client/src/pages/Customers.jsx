import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number must be at least 5 digits'),
  address: z.string().min(5, 'Address is required'),
  dob: z.string().min(1, 'Date of birth is required'),
});

export default function Customers() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'AGENT';

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    fetchCustomers(1, search);
  }, []);

  const fetchCustomers = async (page = 1, searchQuery = search) => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`);
      setCustomers(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to fetch customer records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val) => {
    setSearch(val);
    fetchCustomers(1, val);
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    reset({ name: '', email: '', phone: '', address: '', dob: '1990-01-01' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setValue('name', customer.name);
    setValue('email', customer.email);
    setValue('phone', customer.phone);
    setValue('address', customer.address);
    setValue('dob', new Date(customer.dob).toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer record?')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted successfully');
      fetchCustomers(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, data);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', data);
        toast.success('Customer created successfully');
      }
      setIsModalOpen(false);
      fetchCustomers(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const columns = [
    {
      header: 'Customer Name',
      accessorKey: 'name',
      render: (row) => (
        <div>
          <div className="font-bold text-white">{row.name}</div>
          <div className="text-[11px] text-slate-400">{row.email}</div>
        </div>
      ),
    },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Address', accessorKey: 'address' },
    {
      header: 'DOB',
      accessorKey: 'dob',
      render: (row) => new Date(row.dob).toLocaleDateString(),
    },
    {
      header: 'Policies',
      render: (row) => (
        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 font-bold rounded-lg text-xs border border-blue-500/20">
          {row._count?.policies || row.policies?.length || 0} Policies
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition"
              title="Delete Customer"
            >
              <Trash2 className="w-4 h-4" />
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
          <h2 className="text-xl font-bold text-white">Customer Directory</h2>
          <p className="text-xs text-slate-400 mt-1">Manage customer profiles and insurance coverage</p>
        </div>

        {isStaff && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={customers}
        pagination={pagination}
        onPageChange={(page) => fetchCustomers(page)}
        onSearch={handleSearch}
        searchValue={search}
        loading={loading}
      />

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name</label>
            <input
              type="text"
              {...register('name')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
            <input
              type="email"
              {...register('email')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                {...register('phone')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Date of Birth</label>
              <input
                type="date"
                {...register('dob')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.dob && <p className="text-red-400 text-xs mt-1">{errors.dob.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Address</label>
            <textarea
              rows={3}
              {...register('address')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address.message}</p>}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
