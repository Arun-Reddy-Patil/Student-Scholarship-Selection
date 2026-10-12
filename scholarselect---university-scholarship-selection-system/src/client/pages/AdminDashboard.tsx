import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { DashboardStats, ScholarshipApplication } from '../types/index.js';
import { StatCard } from '../components/StatCard.js';
import { AnalyticsCharts } from '../components/AnalyticsCharts.js';
import { StatusIndicator } from '../components/StatusIndicator.js';
import {
  Users,
  FileText,
  DollarSign,
  Award,
  Sparkles,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApps, setRecentApps] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRes = await api.getDashboardStats();
      setStats(statsRes.stats);

      const appsRes = await api.getApplications();
      setRecentApps(appsRes.applications.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading institutional scholarship dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Scholarship Administration Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Academic Year {stats?.academicYear || '2025-2026'} · Endowment Oversight & Knapsack Selection
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('run-selection')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run Knapsack Optimization</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Grid (8 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Students"
          value={stats?.totalStudents || 0}
          subtitle="Profiles in university directory"
          icon={<Users className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          title="Total Applications"
          value={stats?.totalApplications || 0}
          subtitle={`Requested: $${(stats?.totalRequested || 0).toLocaleString()}`}
          icon={<FileText className="w-5 h-5" />}
          variant="indigo"
        />
        <StatCard
          title="Available Budget"
          value={`$${(stats?.availableBudget || 0).toLocaleString()}`}
          subtitle={stats?.isBudgetFinalized ? 'Status: Cycle finalized' : 'Status: Open for allocation'}
          icon={<DollarSign className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          title="Total Allocated"
          value={`$${(stats?.totalAllocatedAmount || 0).toLocaleString()}`}
          subtitle={`Remaining: $${(stats?.remainingBudget || 0).toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={`${stats?.budgetUtilizationRate || 0}% used`}
          variant="success"
        />
        <StatCard
          title="Selected Students"
          value={stats?.selectedStudentsCount || 0}
          subtitle="Approved scholarship awardees"
          icon={<Award className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          title="Unselected Students"
          value={stats?.unselectedStudentsCount || 0}
          subtitle="Constrained by budget ceiling"
          icon={<Users className="w-5 h-5" />}
          variant="warning"
        />
        <StatCard
          title="Total Priority Score"
          value={stats?.totalPriorityScoreAchieved || 0}
          subtitle="Cumulative institutional merit & need value"
          icon={<Sparkles className="w-5 h-5" />}
          variant="indigo"
        />
        <StatCard
          title="Average Awardee GPA"
          value={stats?.avgSelectedGpa ? stats.avgSelectedGpa.toFixed(2) : '3.88'}
          subtitle="Selected cohort academic benchmark"
          icon={<Award className="w-5 h-5" />}
          variant="default"
        />
      </div>

      {/* Visual Analytics Charts */}
      {stats && (
        <AnalyticsCharts
          availableBudget={stats.availableBudget}
          totalAllocated={stats.totalAllocatedAmount}
          remainingBudget={stats.remainingBudget}
          utilizationRate={stats.budgetUtilizationRate}
          departmentStats={stats.departmentBreakdown || {}}
          statusBreakdown={stats.statusBreakdown || {}}
        />
      )}

      {/* Recent Applications & Fast Access Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              High Priority Scholarship Candidates
            </h3>
            <p className="text-xs text-slate-500">
              Applicants sorted by computed composite score (GPA merit + financial need)
            </p>
          </div>
          <button
            onClick={() => onNavigate('applications')}
            className="text-xs font-medium text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All ({stats?.totalApplications || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-medium uppercase text-[11px] tracking-wider">
                <th className="pb-3 pl-2">Applicant</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Requested Amount</th>
                <th className="pb-3">Priority Score</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentApps.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 pl-2">
                    <span className="font-semibold text-slate-900 block">{app.studentName}</span>
                    <span className="text-[11px] text-slate-500">
                      {app.studentId} · {app.course}
                    </span>
                  </td>
                  <td className="py-3 text-slate-700">{app.department}</td>
                  <td className="py-3 font-mono font-medium text-slate-900">
                    ${app.scholarshipAmount.toLocaleString()}
                  </td>
                  <td className="py-3">
                    <span className="font-mono font-bold text-indigo-700">{app.priorityScore}</span>
                    <span className="text-[10px] text-slate-400 block">
                      GPA {app.gpa} (Merit: {app.meritScore} / Need: {app.financialNeedScore})
                    </span>
                  </td>
                  <td className="py-3">
                    <StatusIndicator status={app.status} size="sm" />
                  </td>
                  <td className="py-3 text-right pr-2">
                    <button
                      onClick={() => onNavigate('applications')}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-xs px-2.5 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
