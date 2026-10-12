import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Budget, ScholarshipApplication } from '../types/index.js';
import { AlgorithmVisualizer } from '../components/AlgorithmVisualizer.js';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface RunSelectionProps {
  onNavigate: (tab: string) => void;
}

export const RunSelection: React.FC<RunSelectionProps> = ({ onNavigate }) => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [customBudget, setCustomBudget] = useState<number>(50000);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [minimumScore, setMinimumScore] = useState<number>(0);
  const [candidateStatus, setCandidateStatus] = useState<string[]>(['Submitted', 'Under Review', 'Draft']);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [finalizing, setFinalizing] = useState(false);
  const [finalizedSuccess, setFinalizedSuccess] = useState<string | null>(null);
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);
  const [finalizeNotes, setFinalizeNotes] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [bRes, aRes] = await Promise.all([api.getBudget(), api.getApplications()]);
        setBudget(bRes.budget);
        setCustomBudget(bRes.budget.totalBudget);
        setApplications(aRes.applications);
      } catch (err) {
        console.error('Failed to init selection form:', err);
      }
    }
    init();
  }, []);

  const handleRunAlgorithm = async () => {
    setLoading(true);
    setError(null);
    setFinalizedSuccess(null);
    try {
      const res = await api.runSelection({
        academicYear: budget?.academicYear || '2025-2026',
        customBudget,
        departmentFilter: departmentFilter !== 'All' ? departmentFilter : undefined,
        minimumScore,
        candidateStatusFilter: candidateStatus,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Optimization run failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!result?.allocationId) return;
    setFinalizing(true);
    try {
      const res = await api.finalizeAllocation(result.allocationId, finalizeNotes);
      setFinalizedSuccess(res.message);
      setConfirmFinalizeOpen(false);
      // Reload applications to reflect new 'Approved' and 'Not Selected' statuses
      const updatedApps = await api.getApplications();
      setApplications(updatedApps.applications);
    } catch (err: any) {
      alert(`Finalization failed: ${err.message}`);
    } finally {
      setFinalizing(false);
    }
  };

  const departments = ['All', 'Computer Science', 'Electrical Engineering', 'Economics', 'Biomedical Engineering', 'Mechanical Engineering', 'Data Science', 'Physics', 'Public Health', 'Architecture', 'Chemistry', 'Civil Engineering', 'Mathematics'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Knapsack Optimization Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            0/1 Knapsack Dynamic Programming with budget constraint validation and deterministic tie-breaking
          </p>
        </div>

        <button
          onClick={handleRunAlgorithm}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Execute Knapsack Optimization</span>
        </button>
      </div>

      {finalizedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-900">Allocation Committed & Finalized!</p>
              <p className="text-emerald-700 mt-0.5">{finalizedSuccess}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('results')}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-xs flex items-center gap-1"
          >
            <span>View Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Configuration Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sliders className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">
            Optimization Parameters & Constraints
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Budget Constraint Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">
                Budget Capacity Constraint (W)
              </label>
              <span className="font-mono font-bold text-indigo-700 text-sm">
                ${customBudget.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="10000"
              max="120000"
              step="2500"
              value={customBudget}
              onChange={(e) => setCustomBudget(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>$10,000</span>
              <span>Default: ${(budget?.totalBudget || 50000).toLocaleString()}</span>
              <span>$120,000</span>
            </div>
          </div>

          {/* Department Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Department Scope</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">
              Run institution-wide or target a specific departmental fund.
            </p>
          </div>

          {/* Minimum Priority Score Threshold */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">
                Minimum Priority Threshold
              </label>
              <span className="font-mono font-semibold text-slate-700 text-xs">
                {minimumScore} / 100
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minimumScore}
              onChange={(e) => setMinimumScore(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Exclude candidates whose composite priority score is below threshold.
            </p>
          </div>
        </div>

        {/* Candidate Pool Status Checkboxes */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-slate-700">Participating Application Statuses:</span>
          {['Submitted', 'Under Review', 'Draft'].map((st) => (
            <label key={st} className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={candidateStatus.includes(st)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setCandidateStatus([...candidateStatus, st]);
                  } else {
                    setCandidateStatus(candidateStatus.filter((s) => s !== st));
                  }
                }}
                className="rounded-xs text-indigo-600 focus:ring-indigo-500"
              />
              <span>{st}</span>
            </label>
          ))}
          <span className="text-[11px] text-slate-400 ml-auto">
            Total Available in Pool: {applications.length} students
          </span>
        </div>
      </div>

      {/* Results Section */}
      {result ? (
        <div className="space-y-6">
          {/* Visualizer */}
          <AlgorithmVisualizer
            algorithmSummary={result.algorithmSummary}
            availableBudget={result.availableBudget}
            totalCost={result.totalCost}
            totalScore={result.totalPriorityScore}
            selectedCandidates={result.selectedStudents}
            unselectedCandidates={result.unselectedStudents}
          />

          {/* Finalize Banner */}
          {!finalizedSuccess && (
            <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Ready to approve and commit this allocation?</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Finalizing will automatically publish decisions to all students: {result.selectedStudents.length} will be Approved with awarded amounts totaling ${result.totalCost.toLocaleString()}, and {result.unselectedStudents.length} unselected.
                </p>
              </div>

              <button
                onClick={() => setConfirmFinalizeOpen(true)}
                className="px-4 py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                Approve & Finalize Decisions
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-white border border-slate-200 shadow-xs">
          <Sparkles className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">Run Optimization Simulation</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Click <strong>&quot;Execute Knapsack Optimization&quot;</strong> above to calculate the mathematical global optimum combination of scholarship recipients that maximizes priority score without exceeding the available budget.
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmFinalizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Scholarship Allocation
                </h3>
                <p className="text-xs text-slate-500">
                  Commitment of ${result?.totalCost?.toLocaleString()} in university awards
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Selected Students:</span>
                <strong className="text-slate-900 font-mono">{result?.selectedStudents?.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Committed Cost:</span>
                <strong className="text-emerald-700 font-mono">${result?.totalCost?.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Remaining University Balance:</span>
                <strong className="text-slate-900 font-mono">${result?.remainingBudget?.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Priority Score Achieved:</span>
                <strong className="text-indigo-700 font-mono">{result?.totalPriorityScore}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Optional Committee Approval Resolution Notes
              </label>
              <textarea
                rows={2}
                value={finalizeNotes}
                onChange={(e) => setFinalizeNotes(e.target.value)}
                placeholder="e.g. Approved in session by University Aid Committee"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setConfirmFinalizeOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalize}
                disabled={finalizing}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {finalizing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Publish Awards</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
