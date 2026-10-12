import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Allocation } from '../types/index.js';
import {
  Layers,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SelectionResultsProps {
  onNavigate: (tab: string) => void;
}

export const SelectionResults: React.FC<SelectionResultsProps> = ({ onNavigate }) => {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadAllocations = async () => {
    setLoading(true);
    try {
      const res = await api.getAllocations();
      setAllocations(res.results);
      if (res.results.length > 0) {
        setExpandedId(res.results[0]._id || null);
      }
    } catch (err) {
      console.error('Failed to load allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Scholarship Allocation Records
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit history of optimization runs, selected student cohorts, and committee commitments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadAllocations}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href={api.getExportCsvUrl()}
            download
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Master CSV</span>
          </a>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Loading historical allocation records...</span>
        </div>
      ) : allocations.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-slate-200 shadow-xs">
          <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Allocation Records Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Run the 0/1 Knapsack optimization algorithm to generate selection solutions.
          </p>
          <button
            onClick={() => onNavigate('run-selection')}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            Go to Optimization Engine
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {allocations.map((alloc) => {
            const isExpanded = expandedId === alloc._id;
            return (
              <div
                key={alloc._id}
                className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : alloc._id || null)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        alloc.isFinalized
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      <Layers className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          Cycle {alloc.academicYear} Allocation
                        </h3>
                        {alloc.isFinalized ? (
                          <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            Finalized & Published
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            Simulation Run
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {alloc.algorithm} ({alloc.algorithmVersion}) · Executed {alloc.createdAt ? new Date(alloc.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 sm:self-center self-end">
                    <div className="text-right font-mono">
                      <span className="text-xs text-slate-500 block">Total Awarded</span>
                      <span className="font-bold text-slate-900 text-sm">
                        ${alloc.totalCost.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs text-slate-500 block">Total Score</span>
                      <span className="font-bold text-indigo-700 text-sm">
                        {alloc.totalPriorityScore}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs text-slate-500 block">Cohort Size</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {alloc.selectedCount} / {alloc.totalApplicantsEvaluated}
                      </span>
                    </div>

                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
                    {alloc.notes && (
                      <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                        <strong>Resolution Note:</strong> {alloc.notes}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Selected Table */}
                      <div className="bg-white rounded-xl border border-emerald-200 p-4">
                        <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Selected Awardees ({alloc.selectedStudents.length})</span>
                          <span className="font-mono text-emerald-700">
                            Sum: ${alloc.totalCost.toLocaleString()}
                          </span>
                        </h4>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {alloc.selectedStudents.map((s) => (
                            <div
                              key={s.studentId}
                              className="p-2 rounded-lg bg-emerald-50/30 border border-emerald-100 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900 block">{s.studentName}</span>
                                <span className="text-[11px] text-slate-500">
                                  {s.studentId} · {s.department}
                                </span>
                              </div>
                              <div className="text-right font-mono">
                                <span className="font-bold text-emerald-700 block">
                                  ${s.scholarshipAmount.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Score: {s.priorityScore} (GPA {s.gpa})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Unselected Table */}
                      <div className="bg-white rounded-xl border border-rose-200 p-4">
                        <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Unfunded Candidates ({alloc.unselectedStudents.length})</span>
                          <span className="font-mono text-slate-500">
                            Rem. Budget: ${alloc.remainingBudget.toLocaleString()}
                          </span>
                        </h4>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {alloc.unselectedStudents.map((u) => (
                            <div
                              key={u.studentId}
                              className="p-2 rounded-lg bg-rose-50/30 border border-rose-100 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-semibold text-slate-800 block">{u.studentName}</span>
                                <span className="text-[11px] text-slate-500 block truncate max-w-[220px]">
                                  {u.reasonUnselected}
                                </span>
                              </div>
                              <div className="text-right font-mono">
                                <span className="text-slate-500 line-through block">
                                  ${u.scholarshipAmount.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-400">Score {u.priorityScore}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
