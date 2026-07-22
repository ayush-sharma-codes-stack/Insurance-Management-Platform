import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar, Line, Pie } from 'react-chartjs-2';
import { Users, ShieldAlert, CreditCard, FileCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [expiringPolicies, setExpiringPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [resMetrics, resExpiring] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/policies/expiring-soon'),
      ]);
      setMetrics(resMetrics.data.data);
      setExpiringPolicies(resExpiring.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 glass-panel animate-pulse rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 glass-panel animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const { summary, charts } = metrics || {};

  // Chart 1: Active vs Expired (Doughnut)
  const policyDoughnutData = {
    labels: ['Active Policies', 'Expired Policies', 'Cancelled Policies'],
    datasets: [
      {
        data: [
          charts?.policyStatus?.ACTIVE || 0,
          charts?.policyStatus?.EXPIRED || 0,
          charts?.policyStatus?.CANCELLED || 0,
        ],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  // Chart 2: Claim Statistics (Bar)
  const claimBarData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        label: 'Claim Count',
        data: [
          charts?.claimStats?.PENDING?.count || 0,
          charts?.claimStats?.APPROVED?.count || 0,
          charts?.claimStats?.REJECTED?.count || 0,
        ],
        backgroundColor: ['#3b82f6', '#10b981', '#f43f5e'],
        borderRadius: 8,
      },
    ],
  };

  // Chart 3: Monthly Premium Collections (Line)
  const premiumLineData = {
    labels: charts?.monthlyPremiums?.map((m) => m.month) || [],
    datasets: [
      {
        label: 'Collected Premiums ($)',
        data: charts?.monthlyPremiums?.map((m) => m.amount) || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Chart 4: Customer Growth (Pie/Line)
  const growthData = {
    labels: charts?.customerGrowth?.map((cg) => cg.month) || [],
    datasets: [
      {
        label: 'New Customers',
        data: charts?.customerGrowth?.map((cg) => cg.count) || [],
        backgroundColor: '#6366f1',
        borderColor: '#818cf8',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 11 } },
      },
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  return (
    <div className="space-y-6">
      {/* Expiry Notification Alert Banner */}
      {expiringPolicies.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4 text-amber-300 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <div>
              <span className="font-bold">Attention Required:</span> {expiringPolicies.length} policy(ies) are expiring within the next 30 days.
            </div>
          </div>
          <a
            href="/policies"
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition text-[11px]"
          >
            Review Policies
          </a>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Customers</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{summary?.totalCustomers || 0}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Active Policies</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{summary?.activePolicies || 0}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Premiums Collected</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">${summary?.totalCollected?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Pending Claims</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{summary?.pendingClaims || 0}</p>
          </div>
        </div>
      </div>

      {/* Chart Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-4">Policy Distribution</h3>
          <div className="h-64 relative flex items-center justify-center">
            <Doughnut data={policyDoughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-4">Claims Overview</h3>
          <div className="h-64">
            <Bar data={claimBarData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-4">Monthly Premium Collections</h3>
          <div className="h-64">
            <Line data={premiumLineData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-4">Customer Registrations</h3>
          <div className="h-64">
            <Bar data={growthData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
