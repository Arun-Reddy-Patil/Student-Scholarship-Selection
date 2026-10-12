import React from 'react';

interface AnalyticsChartsProps {
  availableBudget: number;
  totalAllocated: number;
  remainingBudget: number;
  utilizationRate: number;
  departmentStats: Record<string, { count: number; requested: number; allocated: number; selected: number }>;
  statusBreakdown: Record<string, number>;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  availableBudget,
  totalAllocated,
  remainingBudget,
  utilizationRate,
  departmentStats,
  statusBreakdown,
}) => {
  const departments = Object.keys(departmentStats);
  const maxDeptAmount = Math.max(
    1,
    ...departments.map((d) => Math.max(departmentStats[d].requested, departmentStats[d].allocated))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Budget Utilization Card */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Endowment Pool Utilization</h3>
              <p className="text-xs text-slate-500">Live allocation vs total committed university funds</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-indigo-700 font-mono">
                {utilizationRate}%
              </span>
              <span className="block text-[11px] text-slate-400">utilized</span>
            </div>
          </div>

          {/* Large Visual Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="w-full h-5 rounded-md bg-slate-100 overflow-hidden flex shadow-inner">
              <div
                className="bg-indigo-600 transition-all duration-500 h-full"
                style={{ width: `${Math.min(100, utilizationRate)}%` }}
                title={`Allocated: $${totalAllocated.toLocaleString()}`}
              />
              <div
                className="bg-emerald-400 transition-all duration-500 h-full opacity-60"
                style={{ width: `${Math.max(0, 100 - utilizationRate)}%` }}
                title={`Remaining: $${remainingBudget.toLocaleString()}`}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
                <span>Allocated: ${totalAllocated.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" />
                <span>Available: ${remainingBudget.toLocaleString()}</span>
              </div>
              <div className="font-semibold text-slate-800">
                Cap: ${availableBudget.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution Summary */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            Application Status Flow
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100">
              <span className="block text-lg font-bold text-blue-900 font-mono">
                {statusBreakdown['Submitted'] || 0}
              </span>
              <span className="text-[11px] text-blue-700 font-medium">Submitted</span>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100">
              <span className="block text-lg font-bold text-amber-900 font-mono">
                {statusBreakdown['Under Review'] || 0}
              </span>
              <span className="text-[11px] text-amber-700 font-medium">Under Review</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
              <span className="block text-lg font-bold text-emerald-900 font-mono">
                {(statusBreakdown['Approved'] || 0) + (statusBreakdown['Selected'] || 0)}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Approved / Selected</span>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100">
              <span className="block text-lg font-bold text-rose-900 font-mono">
                {(statusBreakdown['Not Selected'] || 0) + (statusBreakdown['Rejected'] || 0)}
              </span>
              <span className="text-[11px] text-rose-700 font-medium">Not Selected</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Department Allocation Breakdown */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Departmental Funding Analysis</h3>
            <p className="text-xs text-slate-500">Requested vs allocated scholarship capital by academic unit</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 inline-block" />
              <span>Requested</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
              <span>Awarded</span>
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
          {departments.map((dept) => {
            const data = departmentStats[dept];
            const requestedPct = Math.round((data.requested / maxDeptAmount) * 100);
            const allocatedPct = Math.round((data.allocated / maxDeptAmount) * 100);

            return (
              <div key={dept} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 truncate max-w-[180px]">{dept}</span>
                  <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                    <span className="text-slate-600">${data.requested.toLocaleString()} req</span>
                    <span>·</span>
                    <span className="font-semibold text-indigo-700">
                      ${data.allocated.toLocaleString()} awd ({data.selected}/{data.count})
                    </span>
                  </div>
                </div>

                <div className="w-full h-3 rounded-xs bg-slate-100 flex overflow-hidden">
                  <div
                    className="h-full bg-slate-300"
                    style={{ width: `${requestedPct}%` }}
                    title={`Requested: $${data.requested.toLocaleString()}`}
                  />
                  <div
                    className="h-full bg-indigo-600 -ml-full"
                    style={{
                      width: `${allocatedPct}%`,
                      marginLeft: `-${Math.min(requestedPct, allocatedPct)}%`,
                    }}
                    title={`Awarded: $${data.allocated.toLocaleString()}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
