import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { StatusIndicator } from '../components/StatusIndicator.js';
import {
  FileSpreadsheet,
  Printer,
  FileText,
  Award,
  RefreshCw,
  Building,
  CheckCircle2,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.getSelectionReport();
      setReportData(res.report);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Institutional Selection Report & Committee Summary
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal audit report for Academic Year {reportData?.academicYear || '2025-2026'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
          <a
            href={api.getExportCsvUrl()}
            download
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Generating institutional report...</span>
        </div>
      ) : !reportData ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          <p>Report data unavailable.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Institutional Letterhead */}
          <div className="border-b border-slate-200 pb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-800 font-bold text-lg">
                <Building className="w-6 h-6 text-indigo-600" />
                <span>State University Office of Student Financial Aid & Scholarships</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Board of Trustees · Institutional Scholarship Allocation Review Panel
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Cycle: Academic Year {reportData.academicYear} · Generated: {new Date(reportData.generatedAt).toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono uppercase bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-bold">
                Official Record
              </span>
            </div>
          </div>

          {/* Executive Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wide block">
                Total Endowment Pool
              </span>
              <span className="text-base font-bold text-slate-900 font-mono">
                ${(reportData.budget?.totalBudget || 50000).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wide block">
                Total Committed Award
              </span>
              <span className="text-base font-bold text-emerald-700 font-mono">
                ${reportData.totalAwarded.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wide block">
                Approved Recipients
              </span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {reportData.selectedCount} / {reportData.totalApplications}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wide block">
                Uncommitted Reserve
              </span>
              <span className="text-base font-bold text-indigo-700 font-mono">
                ${Math.max(0, (reportData.budget?.totalBudget || 50000) - reportData.totalAwarded).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Approved Students List */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Awarded Scholarship Cohort ({reportData.selected.length})</span>
            </h3>

            {reportData.selected.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No approved scholarships in this cycle yet.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 pl-3">Student ID</th>
                      <th className="py-2.5">Name</th>
                      <th className="py-2.5">Department</th>
                      <th className="py-2.5">GPA</th>
                      <th className="py-2.5">Priority Score</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 pr-3 text-right">Award Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.selected.map((app: any) => (
                      <tr key={app._id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 pl-3 font-mono text-indigo-700 font-semibold">
                          {app.studentId}
                        </td>
                        <td className="py-2.5 font-bold text-slate-900">{app.studentName}</td>
                        <td className="py-2.5 text-slate-700">{app.department}</td>
                        <td className="py-2.5 font-mono">{app.gpa}</td>
                        <td className="py-2.5 font-mono font-bold text-slate-900">{app.priorityScore}</td>
                        <td className="py-2.5">
                          <StatusIndicator status={app.status} size="sm" />
                        </td>
                        <td className="py-2.5 pr-3 text-right font-mono font-bold text-emerald-700">
                          +${(app.awardedAmount || app.scholarshipAmount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Unselected Candidates Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Unselected Candidates & Constraint Log ({reportData.unselected.length})
            </h3>

            {reportData.unselected.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No candidates unselected.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 pl-3">Student ID</th>
                      <th className="py-2.5">Name</th>
                      <th className="py-2.5">Department</th>
                      <th className="py-2.5">Requested</th>
                      <th className="py-2.5">Priority Score</th>
                      <th className="py-2.5 pr-3">Committee Reviewer Note / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.unselected.map((app: any) => (
                      <tr key={app._id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 pl-3 font-mono text-slate-600">{app.studentId}</td>
                        <td className="py-2.5 text-slate-800">{app.studentName}</td>
                        <td className="py-2.5 text-slate-600">{app.department}</td>
                        <td className="py-2.5 font-mono text-slate-600">
                          ${app.scholarshipAmount.toLocaleString()}
                        </td>
                        <td className="py-2.5 font-mono text-slate-600">{app.priorityScore}</td>
                        <td className="py-2.5 pr-3 text-slate-500 italic">
                          {app.reviewerNotes || 'Exceeded available endowment ceiling during 0/1 Knapsack selection.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Institutional Sign-Off Block */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">Dr. Eleanor Vance</p>
              <p className="text-slate-500">Dean of Student Financial Aid & Endowments</p>
              <div className="mt-4 border-b border-slate-400 w-48" />
              <p className="text-[10px] text-slate-400 mt-1">Authorized Signature</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">University Scholarship Committee</p>
              <p className="text-slate-500">Board of Trustees Allocation Review Session</p>
              <div className="mt-4 border-b border-slate-400 w-48" />
              <p className="text-[10px] text-slate-400 mt-1">Date Certified</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
