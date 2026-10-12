import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { ScholarshipApplication, ApplicationStatus } from '../types/index.js';
import { StatusIndicator } from '../components/StatusIndicator.js';
import {
  FileText,
  Search,
  RefreshCw,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  Sliders,
  X,
  Sparkles,
} from 'lucide-react';

export const ApplicationManagement: React.FC = () => {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState<ScholarshipApplication | null>(null);
  const [editAppModal, setEditAppModal] = useState<ScholarshipApplication | null>(null);
  const [editScore, setEditScore] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<ApplicationStatus>('Submitted');
  const [editNotes, setEditNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await api.getApplications({
        search: search || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        department: departmentFilter !== 'All' ? departmentFilter : undefined,
      });
      setApplications(res.applications);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter, departmentFilter]);

  const handleOpenEdit = (app: ScholarshipApplication) => {
    setEditAppModal(app);
    setEditScore(app.priorityScore);
    setEditStatus(app.status);
    setEditNotes(app.reviewerNotes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAppModal?._id) return;

    setSubmitting(true);
    try {
      await api.updateApplication(editAppModal._id, {
        priorityScore: editScore,
        status: editStatus,
        reviewerNotes: editNotes,
      });
      setEditAppModal(null);
      await loadApplications();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const statuses = ['All', 'Submitted', 'Under Review', 'Selected', 'Not Selected', 'Approved', 'Rejected', 'Draft'];
  const departments = ['All', 'Computer Science', 'Electrical Engineering', 'Economics', 'Biomedical Engineering', 'Mechanical Engineering', 'Data Science', 'Physics', 'Public Health', 'Architecture', 'Chemistry', 'Civil Engineering', 'Mathematics'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Scholarship Applications Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review candidate statements, evaluate merit and need scores, and adjust priority criteria
          </p>
        </div>

        <button
          onClick={loadApplications}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Applications</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadApplications()}
            placeholder="Search by student ID, name, email, department, or essay reason..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Dept:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs py-2 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading scholarship applications...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No applications found</p>
            <p className="text-slate-400 mt-1">Try relaxing filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 pl-4">Candidate</th>
                  <th className="py-3">Department & Year</th>
                  <th className="py-3">Requested Amount</th>
                  <th className="py-3">Priority Score</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Decision</th>
                  <th className="py-3 text-right pr-4">Review & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-4">
                      <span className="font-bold text-slate-900 block">{app.studentName}</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {app.studentId} · {app.email}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-medium text-slate-800 block">{app.department}</span>
                      <span className="text-[11px] text-slate-500">{app.academicYear}</span>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-900">
                      ${app.scholarshipAmount.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-700 text-sm">
                          {app.priorityScore}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (M:{app.meritScore} / N:{app.financialNeedScore})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">GPA {app.gpa}</span>
                    </td>
                    <td className="py-3">
                      <StatusIndicator status={app.status} size="sm" />
                    </td>
                    <td className="py-3 font-mono text-[11px]">
                      {app.status === 'Approved' ? (
                        <span className="text-emerald-700 font-bold">
                          +${(app.awardedAmount || app.scholarshipAmount).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 text-[11px]"
                          title="View statement & details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Essay</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(app)}
                          className="px-2.5 py-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-1 text-[11px] font-semibold"
                          title="Edit priority score or status"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Evaluate</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Essay & Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedApp.studentName} · {selectedApp.studentId}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedApp.department} · {selectedApp.course}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Metrics header */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-center">
                <div>
                  <span className="text-[11px] text-slate-500 block">Requested Amount</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    ${selectedApp.scholarshipAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Priority Score</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {selectedApp.priorityScore} / 100
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Current Status</span>
                  <div className="mt-0.5">
                    <StatusIndicator status={selectedApp.status} size="sm" />
                  </div>
                </div>
              </div>

              {/* Statement of purpose */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Statement of Purpose & Hardship Reason
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedApp.reason || 'No statement submitted.'}
                </div>
              </div>

              {/* Score calculation breakdown */}
              <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2">
                <span className="text-xs font-semibold text-indigo-900 block">
                  Priority Scoring Algorithm Breakdown
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span>Academic Merit Score: </span>
                    <strong className="text-slate-900">{selectedApp.meritScore} / 50</strong>
                    <span className="text-[10px] text-slate-400 block">(from GPA {selectedApp.gpa})</span>
                  </div>
                  <div>
                    <span>Financial Need Score: </span>
                    <strong className="text-slate-900">{selectedApp.financialNeedScore} / 50</strong>
                    <span className="text-[10px] text-slate-400 block">(from household profile)</span>
                  </div>
                </div>
              </div>

              {selectedApp.reviewerNotes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Committee Reviewer Notes
                  </h4>
                  <p className="text-xs text-slate-600 bg-amber-50/60 border border-amber-200/70 p-3 rounded-lg">
                    {selectedApp.reviewerNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between">
              <button
                onClick={() => {
                  const target = selectedApp;
                  setSelectedApp(null);
                  handleOpenEdit(target);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Modify Evaluation & Score
              </button>
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluate & Override Modal */}
      {editAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Evaluate Application: {editAppModal.studentName}
                </h3>
                <p className="text-xs text-slate-500">{editAppModal.studentId}</p>
              </div>
              <button
                onClick={() => setEditAppModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Adjust Priority Score (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={editScore}
                  onChange={(e) => setEditScore(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  The 0/1 Knapsack selection engine uses this score as candidate value $v_i$.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Lifecycle Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ApplicationStatus)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Submitted">Submitted (Pending Review)</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Selected">Selected (Pre-Approved)</option>
                  <option value="Not Selected">Not Selected</option>
                  <option value="Approved">Approved (Final Award)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Committee Reviewer Notes
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notes regarding academic standing, interview feedback, or score adjustment..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditAppModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Evaluation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
