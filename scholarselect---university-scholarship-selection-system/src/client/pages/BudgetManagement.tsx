import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Budget } from '../types/index.js';
import { StatCard } from '../components/StatCard.js';
import {
  DollarSign,
  TrendingUp,
  History,
  AlertCircle,
  Save,
  RefreshCw,
  Lock,
  Unlock,
} from 'lucide-react';

export const BudgetManagement: React.FC = () => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [newBudgetAmount, setNewBudgetAmount] = useState<number>(50000);
  const [budgetTitle, setBudgetTitle] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadBudget = async () => {
    setLoading(true);
    try {
      const res = await api.getBudget();
      setBudget(res.budget);
      setNewBudgetAmount(res.budget.totalBudget);
      setBudgetTitle(res.budget.title);
    } catch (err: any) {
      console.error('Failed to load budget:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, []);

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget?._id) return;

    if (newBudgetAmount < 0) {
      setMessage({ text: 'Total budget cannot be negative.', type: 'error' });
      return;
    }

    if (budget.isFinalized && newBudgetAmount < budget.allocatedBudget) {
      setMessage({
        text: `Cannot set budget below $${budget.allocatedBudget.toLocaleString()} as this amount is already awarded.`,
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.updateBudget(budget._id, {
        totalBudget: newBudgetAmount,
        title: budgetTitle,
        notes: changeNotes || 'Budget updated by administrative user.',
      });
      setBudget(res.budget);
      setChangeNotes('');
      setMessage({ text: `Budget updated to $${newBudgetAmount.toLocaleString()} successfully.`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update budget.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const utilizationRate =
    budget && budget.totalBudget > 0
      ? Math.round((budget.allocatedBudget / budget.totalBudget) * 10000) / 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Scholarship Budget Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional endowment allocations, monitor utilization, and track historical revisions
          </p>
        </div>

        <button
          onClick={loadBudget}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Budget</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Available Pool"
          value={`$${(budget?.totalBudget || 0).toLocaleString()}`}
          subtitle={`Cycle: ${budget?.academicYear || '2025-2026'}`}
          icon={<DollarSign className="w-5 h-5" />}
          variant="indigo"
        />
        <StatCard
          title="Total Requested"
          value={`$${(budget?.totalRequested || 0).toLocaleString()}`}
          subtitle={`${budget?.applicationCount || 0} applicant requests`}
          icon={<DollarSign className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          title="Allocated / Awarded"
          value={`$${(budget?.allocatedBudget || 0).toLocaleString()}`}
          subtitle={`${budget?.approvedCount || 0} finalized awardees`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={`${utilizationRate}%`}
          variant="success"
        />
        <StatCard
          title="Uncommitted Funds"
          value={`$${(budget?.remainingBudget || 0).toLocaleString()}`}
          subtitle={budget?.isFinalized ? 'Cycle finalized' : 'Open for Knapsack allocation'}
          icon={<DollarSign className="w-5 h-5" />}
          variant={budget && budget.remainingBudget < 5000 ? 'warning' : 'default'}
        />
      </div>

      {/* Configuration Form & Lock State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Endowment Pool Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Adjust the available scholarship budget ceiling for Academic Year {budget?.academicYear}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {budget?.isFinalized ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Cycle Committed</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Editable</span>
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleUpdateBudget} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Scholarship Fund Title
              </label>
              <input
                type="text"
                required
                value={budgetTitle}
                onChange={(e) => setBudgetTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Total Budget Ceiling ($ USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    step="500"
                    min={budget?.isFinalized ? budget.allocatedBudget : 0}
                    required
                    value={newBudgetAmount}
                    onChange={(e) => setNewBudgetAmount(parseFloat(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Upper capacity constraint W in the 0/1 Knapsack optimization algorithm.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Change Rationale / Board Approval Note
                </label>
                <input
                  type="text"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  placeholder="e.g. Approved board supplemental endowment contribution"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Institutional Safety Rule:</span> The system strictly prevents reducing the budget below already awarded and finalized student amounts (${(budget?.allocatedBudget || 0).toLocaleString()}).
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {submitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Update Endowment Pool</span>
              </button>
            </div>
          </form>
        </div>

        {/* Quick Simulator Card */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400 mb-1">
              Cap vs Demand Ratio
            </h4>
            <p className="text-xs text-slate-400">
              Total demand from applicants vs available funding
            </p>

            <div className="mt-5 space-y-3 font-mono">
              <div className="flex justify-between text-xs pb-1 border-b border-slate-800">
                <span className="text-slate-400">Total Requests:</span>
                <span className="text-white font-bold">${(budget?.totalRequested || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs pb-1 border-b border-slate-800">
                <span className="text-slate-400">Current Budget:</span>
                <span className="text-indigo-400 font-bold">${newBudgetAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs pb-1 border-b border-slate-800">
                <span className="text-slate-400">Deficit / Surplus:</span>
                <span className={newBudgetAmount >= (budget?.totalRequested || 0) ? 'text-emerald-400' : 'text-amber-400'}>
                  {newBudgetAmount >= (budget?.totalRequested || 0)
                    ? `+$${(newBudgetAmount - (budget?.totalRequested || 0)).toLocaleString()} (Full Coverage)`
                    : `-$${((budget?.totalRequested || 0) - newBudgetAmount).toLocaleString()} (Requires Optimization)`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            When budget is insufficient to fund all applicants, the 0/1 Knapsack algorithm identifies the mathematical maximum value subset.
          </div>
        </div>
      </div>

      {/* Historical Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">
            Budget Modification Audit History
          </h3>
        </div>

        {budget?.history && budget.history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 pl-3">Date & Timestamp</th>
                  <th className="py-2.5">Previous Budget</th>
                  <th className="py-2.5">New Budget</th>
                  <th className="py-2.5">Difference</th>
                  <th className="py-2.5">Authorized By</th>
                  <th className="py-2.5 pr-3">Notes & Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {budget.history.slice().reverse().map((h, idx) => {
                  const diff = h.newBudget - h.previousBudget;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 pl-3 text-slate-600 font-sans text-xs">
                        {new Date(h.date).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-slate-600">${h.previousBudget.toLocaleString()}</td>
                      <td className="py-2.5 font-bold text-slate-900">${h.newBudget.toLocaleString()}</td>
                      <td className="py-2.5">
                        <span className={diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {diff >= 0 ? `+$${diff.toLocaleString()}` : `-$${Math.abs(diff).toLocaleString()}`}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-700 font-sans text-xs">{h.changedBy}</td>
                      <td className="py-2.5 pr-3 text-slate-500 font-sans text-xs">{h.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-3">No historical revisions recorded.</p>
        )}
      </div>
    </div>
  );
};
